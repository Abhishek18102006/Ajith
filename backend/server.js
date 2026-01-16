import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import pool from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   PATH FIX (ES MODULE SAFE)
   =============================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================
   HEALTH CHECK
   =============================== */
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "OK", db: "connected" });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ status: "DB ERROR" });
  }
});

/* ===============================
   LOGIN
   =============================== */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT username, section_code FROM users WHERE username=$1 AND password=$2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ===============================
   AI CONFLICT RESOLUTION API
   =============================== */
app.post("/ai-suggest", (req, res) => {
  const payload = req.body;

  console.log("📥 Received AI request:", payload);

  // 🔴 HARD VALIDATION (prevents silent failure)
  const required = [
    "priority_train",
    "affected_train",
    "passengers",
    "distance_km",
    "travel_time_hr",
    "train_capacity",
    "is_peak_hour"
  ];

  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null) {
      console.error(`❌ Missing field: ${key}`);
      return res.status(400).json({
        success: false,
        error: `Missing required field: ${key}`
      });
    }
  }

  // Ensure delay field exists (optional, default to 0)
  if (payload.delay === undefined || payload.delay === null) {
    payload.delay = 0;
  }

  try {
    const pythonScript = path.join(
      __dirname,
      "../ai_model/predict_train.py"
    );

    console.log("🐍 Spawning Python:", pythonScript);

    const python = spawn("python", [pythonScript]);

    let output = "";
    let error = "";

    // Write input to Python stdin
    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();

    // Collect Python stdout
    python.stdout.on("data", data => {
      output += data.toString();
    });

    // Collect Python stderr (for debugging)
    python.stderr.on("data", data => {
      const stderr = data.toString();
      console.log("🐍 Python stderr:", stderr);
      error += stderr;
    });

    // Handle Python process completion
    python.on("close", (code) => {
      console.log("🐍 Python exited with code:", code);

      if (code !== 0) {
        console.error("❌ Python error output:", error);
        return res.status(500).json({ 
          success: false,
          error: "AI execution failed",
          details: error 
        });
      }

      try {
        // Parse Python JSON output
        const result = JSON.parse(output);
        console.log("✅ AI result:", result);
        res.json(result);
      } catch (e) {
        console.error("❌ Invalid AI output:", output);
        res.status(500).json({ 
          success: false,
          error: "Invalid AI response format",
          raw_output: output 
        });
      }
    });

    // Handle Python spawn errors
    python.on("error", (err) => {
      console.error("❌ Failed to spawn Python:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to start AI engine",
        details: err.message 
      });
    });

  } catch (err) {
    console.error("❌ AI ROUTE ERROR:", err);
    res.status(500).json({ 
      success: false,
      error: "AI server error",
      details: err.message 
    });
  }
});

/* ===============================
   START SERVER
   =============================== */
app.listen(5000, () => {
  console.log("🚀 Backend running at http://localhost:5000");
});