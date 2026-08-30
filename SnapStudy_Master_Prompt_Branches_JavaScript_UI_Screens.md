# SnapStudy — Master Prompt & Branch Segregation Plan
### CSI KJSSE Gemini Hackday 2.0 | Aug 30, 2026

---

## DOCUMENT STRUCTURE

1. **MASTER PROMPT (Baseline Skeleton)** — Build this FIRST. Both branches depend on it.
2. **BRANCH A: AI & Data Engine** — Parallel work after baseline is locked.
3. **BRANCH B: Study Experience & PWA Shell** — Parallel work after baseline is locked.
4. **Integration Checkpoints** — Merge rules and verification gates.

> **CRITICAL RULE:** Do NOT start Branch A or Branch B work until the Master Prompt baseline compiles and the shared contracts are committed to `main`.

---

# PART 1: MASTER PROMPT — BASELINE SKELETON

## 1.1 Project Identity

**SnapStudy** is a spatially-grounded study pipeline. It converts a photograph of handwritten notes into structured, type-aware flashcards while preserving the coordinate link between every card and the original page region it came from. When a learner answers incorrectly, the system crops the exact source region from the original photo and uses Gemini to generate a remediation explanation grounded in the student's own material.

**Core Loop:**
```
Photo → Region Detection (Gemini Call 1) → Type-Aware Flashcards (Call 2)
→ Quiz → Wrong Answer → Crop Source Region → Grounded Remediation (Call 3)
```

**Tech Stack:**
- **Frontend:** React 18 + Vite + JavaScript + Tailwind CSS
- **Backend:** Node.js + Express
- **AI:** Google Gemini API (Flash-tier for batch, Flash-Lite for live)
- **Auth/Data:** Firebase Auth + Firestore + Firebase Storage
- **PWA:** `vite-plugin-pwa`, custom service worker for offline study caching
- **Math Rendering:** KaTeX (stretch feature)

---

## 1.2 Shared JavaScript Contracts (NON-NEGOTIABLE)

Create `src/types/index.js`. Both branches MUST import from here. **Never** redefine these shapes.

```javascript
// ============================================
// SHARED CONTRACTS — DO NOT MODIFY WITHOUT SYNC
// JavaScript uses JSDoc for shared data-shape documentation.
// ============================================

/**
 * @typedef {"equation"|"diagram"|"definition"|"list"|"prose"} RegionType
 * @typedef {"qa"|"derivation_steps"|"labeled_diagram"|"timeline"} CardType
 *
 * @typedef {Object} Box2D
 * @property {number} ymin
 * @property {number} xmin
 * @property {number} ymax
 * @property {number} xmax
 *
 * @typedef {Object} Region
 * @property {string} id
 * @property {Box2D} box_2d
 * @property {RegionType} region_type
 * @property {string} label
 * @property {string} raw_text
 *
 * @typedef {Object} Flashcard
 * @property {string} id
 * @property {string} source_region_id
 * @property {CardType} card_type
 * @property {string} front
 * @property {string} back
 * @property {string[]} [steps]
 * @property {DiagramLabel[]} [labels]
 *
 * @typedef {Object} DiagramLabel
 * @property {string} part
 * @property {string} description
 *
 * @typedef {Object} PhotoRecord
 * @property {string} id
 * @property {string} uid
 * @property {string} originalPhotoUrl
 * @property {string} originalPhotoPath
 * @property {Date} createdAt
 * @property {Region[]} regions
 * @property {Flashcard[]} cards
 *
 * @typedef {Object} QuizSession
 * @property {string} id
 * @property {string} photoId
 * @property {string} uid
 * @property {Date} startedAt
 * @property {Date} [completedAt]
 * @property {QuizResponse[]} responses
 *
 * @typedef {Object} QuizResponse
 * @property {string} cardId
 * @property {boolean} correct
 * @property {string} userAnswer
 * @property {number} timeSpentMs
 *
 * @typedef {Object} RemediationPayload
 * @property {string} cropImageBase64
 * @property {string} wrongAnswer
 * @property {string} correctAnswer
 * @property {Region} regionContext
 * @property {CardType} cardType
 *
 * @typedef {Object} RemediationResult
 * @property {string} explanation
 * @property {string[]} hints
 * @property {boolean} referencesSource
 *
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [error]
 *
 * @typedef {Object} DetectRegionsResponse
 * @property {Region[]} regions
 *
 * @typedef {Object} GenerateCardsResponse
 * @property {Flashcard[]} cards
 */

// These JSDoc typedefs are documentation-only; JavaScript does not require
// runtime interfaces or type declarations.
export {};
```

---

## 1.3 Project File Structure (Baseline)

```
snapstudy/
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── server/
│   ├── index.js              # Express entry
│   ├── routes/
│   │   ├── detect.js         # POST /api/detect-regions
│   │   ├── generate.js       # POST /api/generate-cards
│   │   └── remediate.js      # POST /api/remediate
│   ├── services/
│   │   ├── gemini.js         # Gemini client, model routing
│   │   └── crop.js           # Image cropping utility
│   └── utils/
│       └── prompts.js        # All Gemini prompts
├── src/
│   ├── types/
│   │   └── index.js          # SHARED CONTRACTS (above)
│   ├── data/
│   │   └── mock-data.js      # Mock generators for Branch B
│   ├── lib/
│   │   ├── firebase.js       # Firebase init, Auth, Firestore, Storage
│   │   └── api-client.js     # Typed fetch wrappers (stubs → real)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MobileLayout.jsx
│   │   │   ├── DesktopLayout.jsx
│   │   │   └── ResponsiveShell.jsx
│   │   ├── capture/
│   │   │   └── (Branch A owns)
│   │   ├── region-overlay/
│   │   │   └── (Branch A owns)
│   │   ├── study/
│   │   │   └── (Branch B owns)
│   │   ├── quiz/
│   │   │   └── (Branch B owns)
│   │   └── remediation/
│   │       └── (Branch B owns)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePWA.js         # Branch B
│   │   └── useOffline.js     # Branch B
│   ├── utils/
│   │   └── coordinates.js    # Branch A: normalized → pixel conversion
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .env.example
```

---

## 1.4 Firebase Setup (Baseline)

### 1.4.1 Firebase Project Configuration

Create `src/lib/firebase.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Multiple tabs open, persistence enabled in first tab only");
  } else if (err.code === "unimplemented") {
    console.warn("Browser does not support offline persistence");
  }
});
```

### 1.4.2 Firestore Security Rules (Baseline)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    match /quizSessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```

---

## 1.5 Backend Skeleton (Baseline)

Create `server/index.js`:

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import detectRouter from "./routes/detect";
import generateRouter from "./routes/generate";
import remediateRouter from "./routes/remediate";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/detect-regions", detectRouter);
app.use("/api/generate-cards", generateRouter);
app.use("/api/remediate", remediateRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

Create `.env.example`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
GEMINI_API_KEY=
MODEL_BATCH=gemini-3.6-flash
MODEL_LIVE=gemini-3.1-flash-lite
PORT=3001
```

---

## 1.6 API Client Stubs (Baseline)

Create `src/lib/api-client.js`. **Start with mock mode = true.** Branch B builds UI against this. Branch A later sets `MOCK_MODE = false`.

```javascript
import { generateMockRegions, generateMockCards, generateMockRemediation } from "../data/mock-data";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const MOCK_MODE = true; // Branch B sets this. Branch A flips to false when ready.

async function post(path, body) {
  if (MOCK_MODE) {
    // Return mock data based on path
    if (path.includes("detect-regions")) return { success: true, data: generateMockRegions()  };
    if (path.includes("generate-cards")) return { success: true, data: generateMockCards()  };
    if (path.includes("remediate")) return { success: true, data: generateMockRemediation()  };
    return { success: false, error: "Unknown mock path" };
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  detectRegions: (imageBase64) =>
    post("/detect-regions", { image: imageBase64 }),
  generateCards: (regions, imageBase64) =>
    post("/generate-cards", { regions, image: imageBase64 }),
  remediate: (payload) =>
    post("/remediate", payload),
};
```

---

## 1.7 Mock Data Generators (Baseline)

Create `src/data/mock-data.js`:

```javascript
import { } from "../types";


export function generateMockRegions() {
  return {
    regions: [
      {
        id: "region_0",
        box_2d: { ymin: 50, xmin: 50, ymax: 300, xmax: 950 },
        region_type: "equation",
        label: "Quadratic Formula Derivation",
        raw_text: "ax^2 + bx + c = 0 → x = (-b ± √(b²-4ac)) / 2a",
      },
      {
        id: "region_1",
        box_2d: { ymin: 350, xmin: 50, ymax: 700, xmax: 500 },
        region_type: "diagram",
        label: "Parabola Graph",
        raw_text: "Diagram showing upward parabola with vertex, axis of symmetry, and roots labeled",
      },
      {
        id: "region_2",
        box_2d: { ymin: 350, xmin: 550, ymax: 700, xmax: 950 },
        region_type: "definition",
        label: "Discriminant Definition",
        raw_text: "Discriminant (D) = b² - 4ac. Determines nature of roots.",
      },
    ],
  };
}

export function generateMockCards() {
  return {
    cards: [
      {
        id: "card_0",
        source_region_id: "region_0",
        card_type: "derivation_steps",
        front: "Derive the quadratic formula from ax² + bx + c = 0",
        back: "Complete the square on ax² + bx + c = 0",
        steps: [
          "Divide by a: x² + (b/a)x + c/a = 0",
          "Move constant: x² + (b/a)x = -c/a",
          "Add (b/2a)² to both sides",
          "Factor left side: (x + b/2a)² = (b²-4ac)/4a²",
          "Take square root and solve for x",
        ],
      },
      {
        id: "card_1",
        source_region_id: "region_1",
        card_type: "labeled_diagram",
        front: "Label the parts of this parabola",
        back: "Vertex, Axis of Symmetry, Roots, Y-intercept",
        labels: [
          { part: "Vertex", description: "The turning point (h, k) of the parabola" },
          { part: "Axis of Symmetry", description: "Vertical line x = h that divides parabola into mirror images" },
          { part: "Roots", description: "x-intercepts where parabola crosses the x-axis" },
        ],
      },
      {
        id: "card_2",
        source_region_id: "region_2",
        card_type: "qa",
        front: "What does the discriminant tell us about the roots?",
        back: "D > 0: two real roots. D = 0: one real root. D < 0: no real roots.",
      },
    ],
  };
}

export function generateMockRemediation() {
  return {
    explanation: "Looking at your notes, you wrote the discriminant as b² - 4ac. When D < 0, the square root of a negative number is not real, so there are no real roots — the parabola never crosses the x-axis. See your diagram: if the vertex is above the x-axis and opens upward, there are no roots.",
    hints: ["Check the sign of D in your notes", "Look at where your parabola crosses the x-axis"],
    referencesSource: true,
  };
}
```

---

## 1.8 PWA Configuration (Baseline)

### 1.8.1 vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SnapStudy",
        short_name: "SnapStudy",
        description: "Photo-to-flashcards with AI-powered remediation",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "firebase-storage-cache" },
          },
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "api-cache" },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, proxy: { "/api": "http://localhost:3001" } },
});
```

### 1.8.2 manifest.json

```json
{
  "name": "SnapStudy",
  "short_name": "SnapStudy",
  "description": "Photo-to-flashcards with AI-powered remediation",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 1.9 Responsive Layout Shell (Baseline)

Create `src/components/layout/ResponsiveShell.jsx`:

```javascript
import { useState, useEffect } from "react";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";

export default function ResponsiveShell() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

**Mobile Layout Contract:**
- Bottom tab navigation: Capture | Study | Profile
- Full-screen flows, no sidebars
- Touch-first: swipe to flip cards, tap to answer
- Camera occupies full viewport when active
- Single-column layout throughout

**Desktop Layout Contract:**
- Left sidebar navigation (collapsible)
- Split-pane study view: flashcard carousel (left 60%) + stats/progress (right 40%)
- Capture opens in a modal/drawer, not full screen
- Remediation uses split view: cropped source (left) + explanation (right)
- Minimum width: 1024px optimized

---

## 1.10 App.jsx Skeleton (Baseline)

```javascript
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./lib/firebase";
import ResponsiveShell from "./components/layout/ResponsiveShell";
import AuthScreen from "./components/auth/AuthScreen"; // Branch B builds this

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <ResponsiveShell />
    </div>
  );
}

export default App;
```

---

## 1.11 UI Screen Map — Screens & Functionality

The SnapStudy app will have **7 core screens/views**. Capture, quiz, and remediation may appear as modal/full-screen flows depending on device layout.

| # | Screen | Functionality |
|---|---|---|
| 1 | **Auth / Login** | Google or email sign-in; loading/auth state; entry point for the app. |
| 2 | **Capture / Upload** | Take or upload a notebook photo, compress it, upload it, and start AI region detection. |
| 3 | **Region Review** | Display the original note photo with AI-detected regions/bounding boxes and labels before study content is generated. |
| 4 | **Study Dashboard** | Show saved photo-based decks, card counts, last studied status, mastery/progress, and Continue Studying. |
| 5 | **Flashcard / Study** | Present type-aware flashcards (Q&A, derivation, diagram, timeline), with flip interaction and source-region context. |
| 6 | **Quiz / Results** | Run one-card-at-a-time quizzes, record correct/wrong responses, show progress, and display the final score/summary. |
| 7 | **Remediation** | Show the student's wrong answer, exact source crop, grounded explanation, hints, and Continue back to the quiz. |

### Persistent / Secondary UI
- **Profile:** Account information and sign-out; accessible from mobile bottom navigation or desktop sidebar.
- **Offline / Sync UI:** Offline banner, cached-study state, and syncing indicator shown contextually rather than as separate screens.
- **PWA Install Prompt:** Installation prompt appears contextually when supported.

### Primary User Flow
```text
Auth → Capture/Upload → Region Review → Study Dashboard → Flashcard/Study
                                      ↓
                                Quiz / Results
                                      ↓
                                  Remediation
                                      ↓
                               Back to Quiz/Study
```

**Responsive behavior:** Mobile uses full-screen flows with bottom navigation; desktop uses sidebar navigation and split-pane study/remediation layouts.

## 1.11 Git Strategy (Baseline)

```bash
# After baseline is complete and compiles:
git checkout -b branch-a/ai-pipeline
git checkout -b branch-b/study-experience
```

**Merge Rules:**
- `main` is protected. Only merge via pull request at Integration Checkpoints.
- Branch A and Branch B never edit the same files (see ownership map).
- If a contract in `src/types/index.js` needs changing, BOTH branches must agree before merge.

---

# PART 2: BRANCH A — AI & DATA ENGINE

> **Owner:** Person A  
> **Branch:** `branch-a/ai-pipeline`  
> **Goal:** Build everything from photo ingestion → structured data → remediation API. Deliver 3 working endpoints.

## 2.1 What You Own

| Module | Files | Description |
|--------|-------|-------------|
| Photo Capture | `src/components/capture/CaptureScreen.jsx` | Camera + upload UI. Compress image, upload to Firebase Storage, get download URL. |
| Region Detection API | `server/routes/detect.js` | `POST /api/detect-regions`. Gemini Call 1. |
| Flashcard Generation API | `server/routes/generate.js` | `POST /api/generate-cards`. Gemini Call 2. |
| Remediation API | `server/routes/remediate.js` | `POST /api/remediate`. Gemini Call 3. |
| Gemini Service | `server/services/gemini.js` | Client init, model routing (`MODEL_BATCH` vs `MODEL_LIVE`), retry logic. |
| Image Cropping | `server/services/crop.js` | Server-side crop using `sharp`. Normalized → pixel conversion. |
| Coordinate Utilities | `src/utils/coordinates.js` | Convert `box_2d` (0–1000) to pixel coordinates for any image dimensions. |
| Prompts | `server/utils/prompts.js` | All Gemini prompts, persona-conditioned. |
| Region Overlay | `src/components/region-overlay/RegionOverlay.jsx` | Draw bounding boxes on original photo. |
| Firestore Writes | Inline in routes/components | Save `PhotoRecord`, `regions`, `cards` under `uid`. |

## 2.2 What You DO NOT Touch

- `src/components/study/*` — Branch B owns flashcard rendering
- `src/components/quiz/*` — Branch B owns quiz UI
- `src/components/remediation/*` — Branch B owns remediation presentation
- `src/components/layout/*` — Baseline owns responsive shell
- `src/hooks/usePWA.js` — Branch B owns PWA hooks
- `src/hooks/useOffline.js` — Branch B owns offline UX
- Auth UI screens — Branch B owns

## 2.3 Implementation Tasks (In Order)

### Task A1: Firebase Storage Upload + Photo Capture UI

**File:** `src/components/capture/CaptureScreen.jsx`

Build a mobile-first camera screen:
- Use `<input type="file" accept="image/*" capture="environment">` for camera
- Compress image to max 2MB before upload (use canvas resizing)
- Upload to Firebase Storage path: `photos/{uid}/{timestamp}.jpg`
- Get download URL and store in local state
- Show upload progress

**Validation:** Upload a photo, verify it appears in Firebase Storage console.

### Task A2: Gemini Client + Model Routing

**File:** `server/services/gemini.js`

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export function getModel(tier) {
  const modelName = tier === "batch" ? process.env.MODEL_BATCH : process.env.MODEL_LIVE;
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });
}
```

**Validation:** Make throwaway calls to both models. Verify they return JSON.

### Task A3: Coordinate Conversion Utility

**File:** `src/utils/coordinates.js`

```javascript
export function normalizedToPixel(box, imgWidth, imgHeight) {
  return {
    x: Math.round((box.xmin / 1000) * imgWidth),
    y: Math.round((box.ymin / 1000) * imgHeight),
    width: Math.round(((box.xmax - box.xmin) / 1000) * imgWidth),
    height: Math.round(((box.ymax - box.ymin) / 1000) * imgHeight),
  };
}
```

**Validation:** Test with a 1000x1000 image and box `{50,50,300,950}` → expect `{50,50,285,900}`.

### Task A4: Call 1 — Region Detection Endpoint

**File:** `server/routes/detect.js`

```javascript
import express from "express";
import { getModel } from "../services/gemini";
import { regionDetectionPrompt } from "../utils/prompts";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { image } = req.body; // base64 string
    const model = getModel("batch");
    const result = await model.generateContent([
      regionDetectionPrompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } },
    ]);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    // Validate schema
    if (!parsed.regions || !Array.isArray(parsed.regions)) {
      throw new Error("Invalid region schema");
    }
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
```

**Prompt (`server/utils/prompts.js`):**

```javascript
export const regionDetectionPrompt = `Analyze this photo of student notes. Identify distinct content regions.

For each region, return:
- box_2d: [ymin, xmin, ymax, xmax] on a 0-1000 scale
- region_type: one of [equation, diagram, definition, list, prose]
- label: short 3-5 word description
- raw_text: transcribed text or diagram description

Return ONLY valid JSON matching this schema:
{
  "regions": [
    {
      "box_2d": [number, number, number, number],
      "region_type": "string",
      "label": "string",
      "raw_text": "string"
    }
  ]
}`;
```

**Validation:** Test with 3 messy notebook photos. Verify boxes align visually.

### Task A5: Region Overlay Component

**File:** `src/components/region-overlay/RegionOverlay.jsx`

Render the original photo with colored bounding boxes overlaid:
- Use absolute positioning over the image
- Convert normalized coordinates using `normalizedToPixel`
- Color-code by `region_type`: equation=blue, diagram=green, definition=purple, list=orange, prose=gray
- Show label on hover

**Validation:** Overlay matches mock data boxes on a test image.

### Task A6: Call 2 — Flashcard Generation Endpoint

**File:** `server/routes/generate.js`

```javascript
import express from "express";
import { getModel } from "../services/gemini";
import { flashcardGenerationPrompt } from "../utils/prompts";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { regions, image } = req.body;
    const model = getModel("batch");
    const prompt = flashcardGenerationPrompt(regions);
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } },
    ]);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error("Invalid card schema");
    }
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
```

**Prompt:**

```javascript
export function flashcardGenerationPrompt(regions) {
  return `You are an encouraging, subject-aware tutor. Generate flashcards from these detected note regions.

Regions: ${JSON.stringify(regions)}

For each region, create a card with:
- source_region_id: matching the region index
- card_type: qa | derivation_steps | labeled_diagram | timeline (choose based on content)
- front: question or prompt
- back: answer or summary
- steps: array (only for derivation_steps)
- labels: array of {part, description} (only for labeled_diagram)

Return ONLY valid JSON:
{
  "cards": [
    {
      "source_region_id": "string",
      "card_type": "string",
      "front": "string",
      "back": "string",
      "steps": ["string"],
      "labels": [{"part": "string", "description": "string"}]
    }
  ]
}`;
}
```

**Validation:** Cards link back to correct `source_region_id`. At least 2 different `card_type`s appear.

### Task A7: Image Cropping Service

**File:** `server/services/crop.js`

```javascript
import sharp from "sharp";
export async function cropRegion(imageBuffer, box, imgWidth, imgHeight) {
  const x = Math.round((box.xmin / 1000) * imgWidth);
  const y = Math.round((box.ymin / 1000) * imgHeight);
  const width = Math.round(((box.xmax - box.xmin) / 1000) * imgWidth);
  const height = Math.round(((box.ymax - box.ymin) / 1000) * imgHeight);

  return sharp(imageBuffer)
    .extract({ left: x, top: y, width, height })
    .toBuffer();
}
```

**Validation:** Crop a test image. Verify the crop contains the intended content.

### Task A8: Call 3 — Remediation Endpoint

**File:** `server/routes/remediate.js`

```javascript
import express from "express";
import { getModel } from "../services/gemini";
import { remediationPrompt } from "../utils/prompts";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { cropImageBase64, wrongAnswer, correctAnswer, regionContext, cardType } = req.body;
    const model = getModel("live");
    const prompt = remediationPrompt(wrongAnswer, correctAnswer, regionContext, cardType);
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: cropImageBase64, mimeType: "image/jpeg" } },
    ]);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
```

**Prompt:**

```javascript
export function remediationPrompt(wrongAnswer, correctAnswer, regionContext, cardType) {
  return `You are the same encouraging tutor from earlier. The student answered incorrectly.

Region context: ${JSON.stringify(regionContext)}
Card type: ${cardType}
Correct answer: ${correctAnswer}
Student's wrong answer: ${wrongAnswer}

Look at the cropped source image from their notes. Explain WHY they were wrong using ONLY what is visible in their own material. Be concise (2-3 sentences max). Suggest 1-2 hints.

Return ONLY valid JSON:
{
  "explanation": "string",
  "hints": ["string"],
  "referencesSource": true
}`;
}
```

**Validation:** Remediation references visible content in the crop, not generic knowledge.

### Task A9: Firestore Persistence

After each API call, persist to Firestore:

```javascript
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function savePhotoRecord(record: PhotoRecord) {
  await setDoc(doc(db, "photos", record.id), record);
}

export async function saveQuizSession(session: QuizSession) {
  await setDoc(doc(db, "quizSessions", session.id), session);
}
```

**Validation:** Data appears in Firestore console under correct `uid`.

### Task A10: Fallback Strategy

If `box_2d` coordinates are unreliable (test this in first hour):
- Fall back to full-page remediation: send the entire original image + `raw_text` instead of the crop
- Log a warning: "Crop unreliable, using full-page fallback"
- Do NOT silently fail or show a broken crop

---

## 2.4 Branch A Definition of Done

- [ ] Photo uploads to Firebase Storage
- [ ] `POST /api/detect-regions` returns valid regions with `box_2d`
- [ ] Region overlay renders correctly on original photo
- [ ] `POST /api/generate-cards` returns type-branched cards
- [ ] Cards persist to Firestore under `uid`
- [ ] `POST /api/remediate` returns grounded explanation
- [ ] Crop service works deterministically
- [ ] Fallback to full-page remediation is implemented and tested
- [ ] Mock mode can be disabled by Branch B

---

# PART 3: BRANCH B — STUDY EXPERIENCE & PWA SHELL

> **Owner:** Person B  
> **Branch:** `branch-b/study-experience`  
> **Goal:** Build everything the user sees, touches, and feels. Start with mocks, then wire real APIs.

## 3.1 What You Own

| Module | Files | Description |
|--------|-------|-------------|
| Auth UI | `src/components/auth/AuthScreen.jsx` | Google sign-in, email sign-in UI |
| Mobile Layout | `src/components/layout/MobileLayout.jsx` | Bottom nav, full-screen flows |
| Desktop Layout | `src/components/layout/DesktopLayout.jsx` | Sidebar, split-pane study view |
| Study Dashboard | `src/components/study/StudyDashboard.jsx` | Deck list, progress, "Continue" |
| Flashcard Components | `src/components/study/Flashcard*.jsx` | Type-branched card rendering |
| Quiz Flow | `src/components/quiz/QuizScreen.jsx` | Question, answer, scoring, summary |
| Remediation UI | `src/components/remediation/RemediationScreen.jsx` | Crop + explanation presentation |
| PWA Hooks | `src/hooks/usePWA.js` | Install prompt, beforeinstallprompt |
| Offline Hook | `src/hooks/useOffline.js` | Network status, sync indicators |
| Airplane Mode Demo | Inline in components | Toggle for hackathon demo |

## 3.2 What You DO NOT Touch

- `server/*` — Branch A owns all backend
- `src/components/capture/*` — Branch A owns capture
- `src/components/region-overlay/*` — Branch A owns overlay
- `src/utils/coordinates.js` — Branch A owns coordinate math
- `src/lib/api-client.js` — Baseline owns stubs, but you can flip `MOCK_MODE`
- `src/types/index.js` — Baseline owns contracts

## 3.3 Implementation Tasks (In Order)

### Task B1: Auth Screen

**File:** `src/components/auth/AuthScreen.jsx`

Build a clean auth screen:
- Google sign-in button (primary)
- Email/password as fallback
- Dark theme matching `bg-slate-900`
- Show loading state during auth

**Validation:** Sign in successfully. `uid` appears in Firebase Auth console.

### Task B2: Mobile Layout

**File:** `src/components/layout/MobileLayout.jsx`

```javascript
import { useState } from "react";
import CaptureScreen from "../capture/CaptureScreen"; // Branch A builds
import StudyDashboard from "../study/StudyDashboard";

export default function MobileLayout() {
  const [tab, setTab] = useState("capture");

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-slate-100">
      <main className="flex-1 overflow-y-auto">
        {tab === "capture" && <CaptureScreen />}
        {tab === "study" && <StudyDashboard />}
        {tab === "profile" && <div>Profile</div>}
      </main>
      <nav className="flex h-16 border-t border-slate-700 bg-slate-800">
        {["capture", "study", "profile"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 capitalize ${tab === t ? "text-blue-400" : "text-slate-400"}`}
          >
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

**Validation:** Tab switching works. Active tab is highlighted.

### Task B3: Desktop Layout

**File:** `src/components/layout/DesktopLayout.jsx`

```javascript
import { useState } from "react";
import StudyDashboard from "../study/StudyDashboard";

export default function DesktopLayout() {
  const [view, setView] = useState("study");

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <aside className="w-64 border-r border-slate-700 bg-slate-800 p-4">
        <h1 className="mb-8 text-2xl font-bold text-blue-400">SnapStudy</h1>
        {["capture", "study", "profile"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`mb-2 block w-full rounded px-4 py-2 text-left capitalize ${
              view === v ? "bg-blue-600" : "hover:bg-slate-700"
            }`}
          >
            {v}
          </button>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {view === "capture" && <div>Capture opens in modal</div>}
        {view === "study" && <StudyDashboard />}
        {view === "profile" && <div>Profile</div>}
      </main>
    </div>
  );
}
```

**Validation:** Sidebar navigation works. Study view is the default.

### Task B4: Study Dashboard

**File:** `src/components/study/StudyDashboard.jsx`

Display:
- Grid of photo decks (use mock data initially)
- Each deck shows: thumbnail, title, card count, last studied
- "Continue Studying" button for the most recent deck
- Progress ring showing % of cards mastered

**Validation:** Mock decks render. Clicking a deck navigates to quiz.

### Task B5: Type-Branched Flashcard Components

**Files:**
- `src/components/study/FlashcardQa.jsx`
- `src/components/study/FlashcardDerivation.jsx`
- `src/components/study/FlashcardDiagram.jsx`
- `src/components/study/FlashcardTimeline.jsx`
- `src/components/study/FlashcardFlip.jsx` (wrapper with 3D flip animation)

**FlashcardFlip.jsx:**
```javascript
import { useState } from "react";

export default function FlashcardFlip({ front, back, children }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="group relative h-96 w-full cursor-pointer perspective-1000" onClick={() => setFlipped(!flipped)}>
      <div className={`relative h-full w-full transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}>
        <div className="absolute inset-0 backface-hidden rounded-xl bg-slate-800 p-6 shadow-lg">
          <div className="flex h-full flex-col items-center justify-center">{front}</div>
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-blue-900 p-6 shadow-lg">
          <div className="flex h-full flex-col items-center justify-center">{back}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
```

**Add to `index.css`:**
```css
.perspective-1000 { perspective: 1000px; }
.transform-style-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
```

**Validation:** Each card type renders differently. Flip animation is smooth.

### Task B6: Quiz Screen

**File:** `src/components/quiz/QuizScreen.jsx`

- Display one card at a time
- Show progress: "Card 3 of 12"
- After flip, show "I Got It" (green) and "Need Help" (red) buttons
- Track responses in local state
- On "Need Help" → trigger remediation (navigate to RemediationScreen)
- On "I Got It" → next card
- End of quiz → summary screen with score

**Validation:** Complete a mock quiz. Wrong answers trigger remediation navigation.

### Task B7: Remediation Screen (CENTERPIECE)

**File:** `src/components/remediation/RemediationScreen.jsx`

**Mobile layout:** Stacked vertically
1. "You answered: [wrong answer]" in red
2. Cropped source region image (from API)
3. Explanation text
4. Hints list
5. "Got it, continue" button

**Desktop layout:** Split view
- Left 50%: Cropped source region (large)
- Right 50%: Explanation + hints + continue button

**Critical:** Make it OBVIOUS that the explanation references the student's own material. Add a label: "📍 From your notes:" above the crop.

**Validation:** Remediation screen renders mock crop + explanation. Continue button returns to quiz.

### Task B8: PWA Install Prompt

**File:** `src/hooks/usePWA.js`

```javascript
import { useState, useEffect } from "react";

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return { deferredPrompt, isInstalled, install };
}
```

**Validation:** Chrome shows install prompt. App installs to home screen.

### Task B9: Offline UX

**File:** `src/hooks/useOffline.js`

```javascript
import { useState, useEffect } from "react";

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return isOffline;
}
```

Display a banner when offline: "📴 Offline mode — studying cached cards"

**Validation:** Toggle airplane mode. Banner appears. Cached cards remain readable.

### Task B10: Cross-Device Demo Prep

- Ensure Firestore real-time listeners update UI when data changes
- Test: Upload on Phone A → Study on Laptop B (same account)
- Add a "Syncing..." indicator when online and data is being written

**Validation:** Second device shows cards without re-uploading.

---

## 3.4 Branch B Definition of Done

- [ ] Auth screen works with Google sign-in
- [ ] Mobile layout has bottom nav, desktop has sidebar
- [ ] Study dashboard lists decks with progress
- [ ] All 4 card types render with distinct UIs
- [ ] Flashcard flip animation is smooth
- [ ] Quiz flow tracks right/wrong and shows summary
- [ ] Remediation screen shows crop + explanation prominently
- [ ] PWA install prompt works
- [ ] Offline banner appears and cached content remains readable
- [ ] Cross-device continuity demo works

---

# PART 4: INTEGRATION CHECKPOINTS

## CP-1: Baseline Live (~10:30 AM)

**Merge to `main` from:** Baseline skeleton  
**Verify:**
- [ ] `npm run dev` starts both frontend and backend without errors
- [ ] Mock data renders in Branch B components
- [ ] Branch A endpoints return 200 on `/health`
- [ ] Git branches `branch-a/ai-pipeline` and `branch-b/study-experience` exist

## CP-2: First Real Photo (~12:00 PM)

**Merge to `main` from:** Both branches  
**Verify:**
- [ ] Branch A: Photo uploads to Storage, Call 1 returns real regions
- [ ] Branch B: Region overlay renders real regions on photo
- [ ] Both: No JavaScript errors, no broken imports

## CP-3: First Real Cards (~1:30 PM)

**Merge to `main` from:** Both branches  
**Verify:**
- [ ] Branch A: Call 2 generates real cards, persists to Firestore
- [ ] Branch B: Study dashboard shows real cards, flip works
- [ ] Both: `source_region_id` links are correct

## CP-4: Remediation Closed (~3:00 PM)

**Merge to `main` from:** Both branches  
**Verify:**
- [ ] Wrong answer in quiz → triggers remediation
- [ ] Crop is correct and visible
- [ ] Explanation is grounded in the crop
- [ ] Continue button returns to quiz

## CP-5: Demo Lock (~4:15 PM)

**Merge to `main` from:** Final polish from both branches  
**Verify:**
- [ ] Full 5-minute demo rehearsed
- [ ] Airplane mode toggle works
- [ ] Second-device login shows data
- [ ] Backup photos tested
- [ ] No console errors during demo flow

---

# PART 5: EMERGENCY FALLBACKS

## If Gemini API is down or slow

- Use mock data generators as fallback in production build
- Show a "Demo Mode" toggle that uses pre-canned responses
- Pre-test 3 notebook photos and save their responses as JSON files in `public/demo-data/`

## If coordinate detection is unreliable

- Branch A fallback: full-page remediation using `raw_text`
- Branch B: Show the full original photo in remediation instead of crop
- Do NOT show a broken/misaligned crop

## If Firestore offline fails

- Cache cards in `localStorage` as backup
- Show "Limited offline mode" banner instead of full offline

## If team is reduced to 2 people

- Merge Person A (Auth/Firestore) into Branch A owner
- Branch B owner takes frontend + PWA
- Drop stretch features (KaTeX, clickable diagrams)
- Focus on: capture → regions → cards → quiz → remediation

---

# PART 6: FINAL CHECKLIST BEFORE HACKATHON STARTS

- [ ] Firebase project created, Auth + Firestore + Storage enabled
- [ ] Gemini API key obtained and tested with throwaway call
- [ ] `.env` file populated with all keys (DO NOT COMMIT)
- [ ] Git repo initialized, `main` branch protected
- [ ] Both team members can run `npm run dev` locally
- [ ] 3 messy notebook photos prepared for testing
- [ ] Second device (phone or laptop) available for cross-device demo
- [ ] Airplane mode toggle accessible on demo device
- [ ] Backup plan discussed and agreed upon

---

*End of Document. Build the baseline first. Then split and conquer.*
