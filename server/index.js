import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import detectRouter from "./routes/detect.js";
import generateRouter from "./routes/generate.js";
import remediateRouter from "./routes/remediate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_ORIGIN,           // e.g. https://snapstudy.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl with no origin
      if (!origin) return callback(null, true);
      // Allow any *.vercel.app preview deployment
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/detect-regions", detectRouter);
app.use("/api/generate-cards", generateRouter);
app.use("/api/remediate", remediateRouter);

// ── Health check (CP-1 gate) ────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 fallthrough ─────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: "Not found" }));

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 SnapStudy server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
