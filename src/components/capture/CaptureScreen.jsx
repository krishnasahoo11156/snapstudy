import { useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../lib/firebase";
import { compressImage, uploadPhotoToStorage } from "../../lib/storage";
import { savePhotoRecord, deletePhotoRecord } from "../../lib/firestore";
import { api, isMockMode, setMockMode } from "../../lib/api-client";
import RegionOverlay, { REGION_COLORS } from "../region-overlay/RegionOverlay";
import QuizScreen from "../quiz/QuizScreen";

const CARD_TYPE_BADGES = {
  qa: { label: "Q&A", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  derivation_steps: { label: "Derivation Steps", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  labeled_diagram: { label: "Labeled Diagram", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  timeline: { label: "Timeline Process", bg: "bg-orange-50 text-orange-700 border-orange-200" },
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
  const [currentPhotoId, setCurrentPhotoId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [useMock, setUseMock] = useState(isMockMode());

  const [quizActive, setQuizActive] = useState(false);

  const handleToggleMock = (e) => {
    const checked = e.target.checked;
    setUseMock(checked);
    setMockMode(checked);
  };

  if (quizActive) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <QuizScreen
          deck={{
            id: `deck_${fileName || Date.now()}`,
            title: fileName ? `Notes — ${fileName}` : "Note Flashcards",
            subject: detectedRegions[0]?.region_type || "Study Notes",
          }}
          cards={generatedCards}
          regions={detectedRegions}
          photoUrl={previewUrl}
          onExit={() => setQuizActive(false)}
        />
      </div>
    );
  }

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

      // 2. Parallel Storage Upload + Fast Single-Pass AI Processing
      const uid = user?.uid || "guest_user";
      setCurrentStep("Analyzing notes & generating flashcards with Gemini…");

      const storagePromise = uploadPhotoToStorage(
        compressed.blob,
        uid,
        (progress) => setUploadProgress(progress),
        compressed.dataUrl
      );

      const aiPromise = api.ingest(cleanBase64);

      // Await AI generation and storage upload in parallel
      const [storageRes, ingestRes] = await Promise.all([storagePromise, aiPromise]);

      if (!ingestRes.success || !ingestRes.data?.regions || !ingestRes.data?.cards) {
        throw new Error(ingestRes.error || "Failed to process note image with AI.");
      }

      const { regions, cards } = ingestRes.data;
      setDetectedRegions(regions);
      setGeneratedCards(cards);

      // 3. Persist to Firestore / Local Cache
      setCurrentStep("Saving photo and cards to your study deck…");
      const photoId = `photo_${Date.now()}`;
      setCurrentPhotoId(photoId);
      const record = {
        id: photoId,
        uid,
        originalPhotoUrl: storageRes.downloadUrl || compressed.dataUrl,
        originalPhotoPath: storageRes.storagePath,
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
    setCurrentPhotoId(null);
    setShowDeleteConfirm(false);
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDeleteCurrentNote = async () => {
    try {
      if (currentPhotoId) {
        await deletePhotoRecord(currentPhotoId, user?.uid);
      }
      handleReset();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <div className="flex min-h-full flex-col p-4 md:p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-paper-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-bold border border-accent/20">
              A
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              AI Note Ingestion & Card Engine
            </h1>
          </div>
          <p className="text-xs md:text-sm text-ink-secondary mt-1">
            Photograph notes → Spatial region detection → Type-aware flashcards with coordinate linkage
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {flowState === "idle" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            id="capture-upload-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="group relative flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-paper-border bg-white p-12 text-center transition-all hover:border-accent hover:bg-accent/5 shadow-card"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 border border-accent/20 text-accent shadow-sm group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>

            <div>
              <p className="text-lg font-bold text-ink">Upload or Capture Notebook Photo</p>
              <p className="mt-1.5 text-xs text-ink-secondary">
                Drag & drop note image here or tap to use camera (JPEG, PNG · Max 10MB)
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <span className="rounded-full bg-paper-warm px-2.5 py-1 text-[11px] font-medium text-ink-secondary border border-paper-border">
                📐 Math Equations
              </span>
              <span className="rounded-full bg-paper-warm px-2.5 py-1 text-[11px] font-medium text-ink-secondary border border-paper-border">
                📊 Scientific Diagrams
              </span>
              <span className="rounded-full bg-paper-warm px-2.5 py-1 text-[11px] font-medium text-ink-secondary border border-paper-border">
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
            <div className="h-24 w-24 rounded-full border-4 border-paper-border" />
            <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-t-accent border-r-accent/40 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              ✨
            </div>
          </div>

          <h3 className="text-xl font-bold text-ink">Processing Study Notes</h3>
          <p className="mt-2 text-sm font-medium text-accent animate-pulse">{currentStep}</p>

          {/* Stepper Progress */}
          <div className="mt-8 w-full space-y-3 rounded-2xl border border-paper-border bg-white p-5 text-left text-xs shadow-card">
            <div className="flex items-center justify-between text-ink">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${uploadProgress > 0 ? "bg-emerald-500" : "bg-ink-tertiary"}`} />
                Storage Ingestion
              </span>
              <span className="font-mono text-ink-secondary">{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-warm border border-paper-border">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error View */}
      {flowState === "error" && (
        <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center animate-fade-in max-w-lg mx-auto shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
            ⚠️
          </div>
          <h3 className="text-lg font-bold text-red-800">Processing Error</h3>
          <p className="mt-1 text-xs text-red-600/90 font-mono">{errorMessage}</p>
          <div className="mt-5 flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="rounded-xl border border-paper-border bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-paper-warm transition shadow-sm"
            >
              Try Another Image
            </button>
            <button
              onClick={() => {
                setUseMock(true);
                setMockMode(true);
                setFlowState("idle");
              }}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-sm"
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-paper-border bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold text-ink">
                  {detectedRegions.length} Regions & {generatedCards.length} Flashcards Generated
                </p>
                <p className="text-xs text-ink-secondary">
                  Linked by spatial coordinates. Click regions to inspect linked cards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuizActive(true)}
                id="start-quiz-btn"
                className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-hover transition-all"
              >
                <span>🚀</span>
                <span>Start Quiz ({generatedCards.length} Cards)</span>
              </button>
              <button
                onClick={handleReset}
                className="rounded-xl border border-paper-border bg-white px-3.5 py-2 text-xs font-medium text-ink hover:bg-paper-warm transition shadow-sm"
              >
                Scan Another
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete this note"
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-md rounded-3xl border border-paper-border bg-white p-6 shadow-panel space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-ink">Delete This Scanned Note?</h3>
                  <p className="text-xs text-ink-secondary mt-1">
                    This will discard this note photo and delete all {generatedCards.length} generated flashcards.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-xl border border-paper-border bg-white px-4 py-2 text-xs font-semibold text-ink-secondary hover:bg-paper-warm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCurrentNote}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
                  >
                    Delete Note
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid Layout: Region Overlay on Left, Flashcards on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Region Overlay */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Spatial Region Map
                </h3>
                <span className="text-[11px] text-ink-tertiary">
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
                          ? "bg-accent text-white border-accent ring-2 ring-accent/30 shadow-sm"
                          : `${colors.badge} hover:opacity-90`
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : colors.dot}`} />
                      <span>{region.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Generated Flashcards */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Type-Aware Flashcards ({generatedCards.length})
                </h3>
                {selectedRegionId && (
                  <button
                    onClick={() => setSelectedRegionId(null)}
                    className="text-[11px] text-accent hover:underline font-medium"
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
                            ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-card"
                            : "border-paper-border bg-white hover:border-paper-border/80 hover:shadow-card shadow-sm"
                        }`}
                      >
                        {/* Header: Card Type & Linked Region */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {linkedRegion && (
                            <span className="text-[10px] font-mono text-ink-secondary truncate">
                              📍 {linkedRegion.label}
                            </span>
                          )}
                        </div>

                        {/* Front (Question) */}
                        <div className="mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
                            Front / Question
                          </span>
                          <p className="text-xs font-semibold text-ink mt-0.5">
                            {card.front}
                          </p>
                        </div>

                        {/* Back (Answer) */}
                        <div className="rounded-xl bg-paper-warm p-2.5 border border-paper-border">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
                            Back / Key Concept
                          </span>
                          <p className="text-xs text-ink-secondary mt-0.5">
                            {card.back}
                          </p>

                          {/* Derivation Steps if available */}
                          {Array.isArray(card.steps) && card.steps.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-paper-border pt-2">
                              <span className="text-[9px] font-bold uppercase text-emerald-700">
                                Derivation Steps:
                              </span>
                              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-ink-secondary">
                                {card.steps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Labeled Diagram parts if available */}
                          {Array.isArray(card.labels) && card.labels.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-paper-border pt-2">
                              <span className="text-[9px] font-bold uppercase text-purple-700">
                                Labeled Elements:
                              </span>
                              <div className="grid grid-cols-1 gap-1">
                                {card.labels.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="font-semibold text-purple-700">{item.part}:</span>
                                    <span className="text-ink-secondary">{item.description}</span>
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
