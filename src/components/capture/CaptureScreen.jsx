import { useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../lib/firebase";
import { compressImage, uploadPhotoToStorage } from "../../lib/storage";
import { savePhotoRecord } from "../../lib/firestore";
import { api, isMockMode, setMockMode } from "../../lib/api-client";
import RegionOverlay, { REGION_COLORS } from "../region-overlay/RegionOverlay";

const CARD_TYPE_BADGES = {
  qa: { label: "Q&A", bg: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  derivation_steps: { label: "Derivation Steps", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  labeled_diagram: { label: "Labeled Diagram", bg: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  timeline: { label: "Timeline Process", bg: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
};

export default function CaptureScreen() {
  const [user] = auth ? useAuthState(auth) : [null];
  const inputRef = useRef(null);

  // Flow states: 'idle' | 'processing' | 'done' | 'error'
  const [flowState, setFlowState] = useState("idle");
  const [currentStep, setCurrentStep] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Data states
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rawBase64, setRawBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [detectedRegions, setDetectedRegions] = useState([]);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [useMock, setUseMock] = useState(isMockMode());

  const handleToggleMock = (e) => {
    const checked = e.target.checked;
    setUseMock(checked);
    setMockMode(checked);
  };

  const processImageFile = async (file) => {
    if (!file) return;

    try {
      setFlowState("processing");
      setErrorMessage("");
      setFileName(file.name);
      setSelectedRegionId(null);

      // 1. Compress Image
      setCurrentStep("Compressing image…");
      const compressed = await compressImage(file, 1280, 1280, 0.78);
      setPreviewUrl(compressed.dataUrl);
      const cleanBase64 = compressed.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      setRawBase64(cleanBase64);

      // 2. Upload to Free Storage
      setCurrentStep("Processing & saving note image…");
      const uid = user?.uid || "guest_user";
      const { downloadUrl, storagePath } = await uploadPhotoToStorage(
        compressed.blob,
        uid,
        (progress) => setUploadProgress(progress),
        compressed.dataUrl
      );

      // 3. Gemini Call 1: Detect Regions
      setCurrentStep("Analyzing notebook regions with Gemini AI…");
      const detectRes = await api.detectRegions(cleanBase64);
      if (!detectRes.success || !detectRes.data?.regions) {
        throw new Error(detectRes.error || "Failed to detect note regions.");
      }
      const regions = detectRes.data.regions;
      setDetectedRegions(regions);

      // 4. Gemini Call 2: Generate Type-Aware Flashcards
      setCurrentStep("Generating type-aware flashcards…");
      const cardsRes = await api.generateCards(regions, cleanBase64);
      if (!cardsRes.success || !cardsRes.data?.cards) {
        throw new Error(cardsRes.error || "Failed to generate flashcards.");
      }
      const cards = cardsRes.data.cards;
      setGeneratedCards(cards);

      // 5. Persist to Firestore / Local Cache
      setCurrentStep("Saving photo and cards to your study deck…");
      const photoId = `photo_${Date.now()}`;
      const record = {
        id: photoId,
        uid,
        originalPhotoUrl: downloadUrl || compressed.dataUrl,
        originalPhotoPath: storagePath,
        createdAt: new Date(),
        regions,
        cards,
      };

      // Save locally and sync in background without blocking UI render
      savePhotoRecord(record).catch((e) => console.warn("Background save error:", e));

      setFlowState("done");
      setCurrentStep("");
    } catch (err) {
      console.error("[Capture Pipeline Error]", err);
      setFlowState("error");
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleReset = () => {
    setFlowState("idle");
    setPreviewUrl(null);
    setRawBase64("");
    setFileName("");
    setDetectedRegions([]);
    setGeneratedCards([]);
    setSelectedRegionId(null);
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex min-h-full flex-col p-4 md:p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 text-sm font-bold border border-blue-500/30">
              A
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              AI Note Ingestion & Card Engine
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Photograph notes → Spatial region detection → Type-aware flashcards with coordinate linkage
          </p>
        </div>

        {/* Mock/Live Toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer rounded-xl bg-slate-800/80 px-3.5 py-2 border border-slate-700/60 hover:bg-slate-800 transition">
          <input
            type="checkbox"
            checked={useMock}
            onChange={handleToggleMock}
            className="rounded border-slate-600 text-blue-500 focus:ring-blue-500/30 h-4 w-4 bg-slate-900"
          />
          <div className="text-left">
            <span className="block text-xs font-semibold text-slate-200">
              {useMock ? "🧪 Mock Mode Enabled" : "⚡ Real Gemini API"}
            </span>
            <span className="block text-[10px] text-slate-400">
              {useMock ? "Simulated AI responses" : "Live Gemini 1.5 Flash backend"}
            </span>
          </div>
        </label>
      </div>

      {/* Main Content Area */}
      {flowState === "idle" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            id="capture-upload-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="group relative flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-12 text-center transition-all hover:border-blue-500/60 hover:bg-blue-500/5 shadow-2xl backdrop-blur-sm"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/40 shadow-inner group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>

            <div>
              <p className="text-lg font-bold text-slate-100">Upload or Capture Notebook Photo</p>
              <p className="mt-1.5 text-xs text-slate-400">
                Drag & drop note image here or tap to use camera (JPEG, PNG · Max 10MB)
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700">
                📐 Math Equations
              </span>
              <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700">
                📊 Scientific Diagrams
              </span>
              <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700">
                📝 Definitions & Lists
              </span>
            </div>

            <input
              ref={inputRef}
              id="capture-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              className="sr-only"
            />
          </div>
        </div>
      )}

      {/* Processing Pipeline View */}
      {flowState === "processing" && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in max-w-lg mx-auto">
          <div className="relative mb-8">
            <div className="h-24 w-24 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-t-blue-500 border-r-violet-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              ✨
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-100">Processing Study Notes</h3>
          <p className="mt-2 text-sm font-medium text-blue-400 animate-pulse">{currentStep}</p>

          {/* Stepper Progress */}
          <div className="mt-8 w-full space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${uploadProgress > 0 ? "bg-emerald-400" : "bg-slate-600"}`} />
                Storage Ingestion
              </span>
              <span className="font-mono text-slate-400">{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error View */}
      {flowState === "error" && (
        <div className="my-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center animate-fade-in max-w-lg mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-3">
            ⚠️
          </div>
          <h3 className="text-lg font-bold text-red-200">Processing Error</h3>
          <p className="mt-1 text-xs text-red-300/80 font-mono">{errorMessage}</p>
          <div className="mt-5 flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Try Another Image
            </button>
            <button
              onClick={() => {
                setUseMock(true);
                setMockMode(true);
                setFlowState("idle");
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
            >
              Switch to Mock Mode
            </button>
          </div>
        </div>
      )}

      {/* Results View */}
      {flowState === "done" && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">
                  {detectedRegions.length} Regions & {generatedCards.length} Flashcards Generated
                </p>
                <p className="text-xs text-slate-400">
                  Linked by spatial coordinates. Click regions to inspect linked cards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Scan Another Note
              </button>
            </div>
          </div>

          {/* Grid Layout: Region Overlay on Left, Flashcards on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Region Overlay */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Spatial Region Map
                </h3>
                <span className="text-[11px] text-slate-400">
                  Hover or tap any box to highlight
                </span>
              </div>

              <RegionOverlay
                src={previewUrl}
                regions={detectedRegions}
                selectedRegionId={selectedRegionId}
                onSelectRegion={(region) => setSelectedRegionId(region.id)}
              />

              {/* Region chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {detectedRegions.map((region) => {
                  const colors = REGION_COLORS[region.region_type] || REGION_COLORS.prose;
                  const isSelected = selectedRegionId === region.id;
                  return (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegionId(isSelected ? null : region.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        isSelected
                          ? "bg-blue-600/30 border-blue-400 text-blue-200 ring-2 ring-blue-500/40"
                          : `${colors.badge} hover:opacity-100`
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      <span>{region.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Generated Flashcards */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Type-Aware Flashcards ({generatedCards.length})
                </h3>
                {selectedRegionId && (
                  <button
                    onClick={() => setSelectedRegionId(null)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Show all cards
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                {generatedCards
                  .filter((card) => !selectedRegionId || card.source_region_id === selectedRegionId)
                  .map((card) => {
                    const badge = CARD_TYPE_BADGES[card.card_type] || CARD_TYPE_BADGES.qa;
                    const linkedRegion = detectedRegions.find((r) => r.id === card.source_region_id);
                    const isLinkedSelected = selectedRegionId === card.source_region_id;

                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedRegionId(card.source_region_id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                          isLinkedSelected
                            ? "border-blue-500/80 bg-blue-950/40 ring-1 ring-blue-500/50 shadow-xl"
                            : "border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        {/* Header: Card Type & Linked Region */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {linkedRegion && (
                            <span className="text-[10px] font-mono text-slate-400 truncate">
                              📍 {linkedRegion.label}
                            </span>
                          )}
                        </div>

                        {/* Front (Question) */}
                        <div className="mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Front / Question
                          </span>
                          <p className="text-xs font-semibold text-slate-100 mt-0.5">
                            {card.front}
                          </p>
                        </div>

                        {/* Back (Answer) */}
                        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Back / Key Concept
                          </span>
                          <p className="text-xs text-slate-300 mt-0.5">
                            {card.back}
                          </p>

                          {/* Derivation Steps if available */}
                          {Array.isArray(card.steps) && card.steps.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-slate-800/80 pt-2">
                              <span className="text-[9px] font-bold uppercase text-emerald-400">
                                Derivation Steps:
                              </span>
                              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-400">
                                {card.steps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Labeled Diagram parts if available */}
                          {Array.isArray(card.labels) && card.labels.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-slate-800/80 pt-2">
                              <span className="text-[9px] font-bold uppercase text-purple-400">
                                Labeled Elements:
                              </span>
                              <div className="grid grid-cols-1 gap-1">
                                {card.labels.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="font-semibold text-purple-300">{item.part}:</span>
                                    <span className="text-slate-400">{item.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
