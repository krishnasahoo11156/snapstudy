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

// ── CORS Configuration ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://snapstudy-ten.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server, health checks)
    if (!origin) return callback(null, true);

    // Allow exact allowed origins and any *.vercel.app preview URLs
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    return callback(new Error(`CORS Error: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Response-Time"],
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 204,
};

// Apply CORS middleware first, before body parsers and routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
