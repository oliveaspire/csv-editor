import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { DataModel } from "./models/data.model.js";

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const MONGO_URI =
  "mongodb+srv://olive:qwerty1234@cluster0.oylwx.mongodb.net/csv_database?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true";

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error("Failed to connect to MongoDB after retries");
  process.exit(1);
};

connectWithRetry();

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    dbConnected: mongoose.connection.readyState === 1,
  });
});

app.get("/api/data", async (req, res) => {
  try {
    const data = await DataModel.find({});
    console.log(`Fetched ${data.length} records from database`);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ success: false, message: "Failed to fetch data" });
  }
});

app.post("/api/data", async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid data format" });
    }

    
    await DataModel.deleteMany({});
    console.log("Cleared existing data");

   
    const result = await DataModel.insertMany(data);
    console.log(`Inserted ${result.length} records`);

    res.json({ success: true, message: "Data saved successfully" });
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).json({ success: false, message: "Failed to save data" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

mongoose.connection.once("open", () => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
