import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import detectRouter from "./routes/detect.js";
import generateRouter from "./routes/generate.js";
import remediateRouter from "./routes/remediate.js";
import ingestRouter from "./routes/ingest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from root .env first, then fallback to server-specific .env
dotenv.config({ path: join(__dirname, "..", ".env") });
dotenv.config({ path: join(__dirname, ".env") });

const app = express();

// ── CORS Configuration ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://snapstudy-ten.vercel.app",
  "https://snapstudy.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser / curl / server-to-server
  const clean = origin.replace(/\/+$/, "").toLowerCase();
  return (
    ALLOWED_ORIGINS.some((allowed) => clean === allowed.replace(/\/+$/, "").toLowerCase()) ||
    clean.endsWith(".vercel.app") ||
    clean.includes("vercel.app")
  );
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Response-Time"],
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 200,
};

// Apply CORS middleware first, before body parsers and routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Explicit fallback to ensure CORS headers on every response regardless of route state
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin");
  }
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Request Logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || "none"}`);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/ingest", ingestRouter); // Fast unified single-pass (2-3x speedup)
app.use("/api/detect-regions", detectRouter);
app.use("/api/generate-cards", generateRouter);
app.use("/api/remediate", remediateRouter);

// ── Health check (CP-1 gate) ────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 fallthrough ─────────────────────────────────────────────────────────
app.use((req, res) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global Error Handler (guarantees CORS headers even on uncaught errors) ──
app.use((err, req, res, _next) => {
  console.error("[Unhandled Server Error]", err);
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.status(err.status || 500).json({ success: false, error: err?.message || "Internal server error" });
});

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 SnapStudy server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
