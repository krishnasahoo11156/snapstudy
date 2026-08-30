import { useRef, useState } from "react";

/**
 * CaptureScreen — Branch A will build the full camera + Gemini pipeline here.
 * This baseline stub provides the file input UI and compression boilerplate.
 */
export default function CaptureScreen() {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleReset = () => {
    setPreview(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6 animate-fade-in">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-100">Capture Notes</h2>
          <p className="mt-1 text-sm text-slate-400">
            Take a photo or upload your notebook page
          </p>
        </div>

        {!preview ? (
          /* Upload Zone */
          <button
            id="capture-upload-zone"
            onClick={() => inputRef.current?.click()}
            className="glass-card relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-600 p-12 text-center transition-all hover:border-blue-500/60 hover:bg-blue-500/5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200">Tap to capture or upload</p>
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG · Max 10MB</p>
            </div>
            <input
              ref={inputRef}
              id="capture-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="sr-only"
            />
          </button>
        ) : (
          /* Preview */
          <div className="animate-fade-in space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-700">
              <img
                src={preview}
                alt="Captured notes preview"
                className="w-full object-cover"
              />
            </div>
            <p className="text-center text-xs text-slate-500 truncate">{fileName}</p>

            <div className="flex gap-3">
              <button
                id="capture-retake-btn"
                onClick={handleReset}
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Retake
              </button>
              <button
                id="capture-analyze-btn"
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-violet-500 transition-all"
                onClick={() => alert("Branch A: Connect to /api/detect-regions")}
              >
                Analyze Notes ✨
              </button>
            </div>
          </div>
        )}

        {/* Branch A placeholder notice */}
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-400/80 text-center">
            🔧 Branch A — Connect Gemini region detection here
          </p>
        </div>
      </div>
    </div>
  );
}
