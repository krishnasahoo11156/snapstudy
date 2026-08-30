import { useState, useRef, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../lib/firebase";
import { getPhotoRecords } from "../../lib/firestore";
import { useNav } from "../../context/NavContext";
import StickyNote from "./StickyNote";
import Header from "../ui/Header";

const DEFAULT_STARTER_FOLDERS = [
  { id: "f1", name: "Science", icon: "⚛️", itemCount: 4, lastStudied: "Today", color: "yellow", decoration: "tape", rotation: -2, x: 210, y: 90, zIndex: 1 },
  { id: "f2", name: "Mathematics", icon: "√x", itemCount: 2, lastStudied: "Yesterday", color: "pink", decoration: "pin", pinColor: "#DC2626", rotation: 1.5, x: 400, y: 80, zIndex: 1 },
  { id: "f3", name: "Computer Science", icon: "</>", itemCount: 3, lastStudied: "3 days ago", color: "blue", decoration: "tape-sideways", rotation: -1, x: 590, y: 95, zIndex: 1 },
  { id: "f4", name: "Physics & Notes", icon: "📝", itemCount: 1, lastStudied: "Recently", color: "green", decoration: "pin", pinColor: "#16A34A", rotation: 2, x: 780, y: 85, zIndex: 1 },
];

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_DONE = [true, true, true, true, true, true, false];

export default function StudyCanvas() {
  const { navigate } = useNav();
  const [user] = auth ? useAuthState(auth) : [null];
  const uid = user?.uid || "guest_user";
  const storageKey = `snapstudy_folders_${uid}`;

  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load initial folders from localStorage:", e);
    }
    return DEFAULT_STARTER_FOLDERS;
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const canvasRef = useRef(null);

  // Reload user folders & sync with Firestore when user logs in or switches account
  useEffect(() => {
    // 1. Initial reload from user's localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setFolders(JSON.parse(saved));
      } else {
        setFolders(DEFAULT_STARTER_FOLDERS);
      }
    } catch (e) {
      console.warn("Failed to load user folders from localStorage:", e);
    }

    // 2. Sync with cloud Firestore photo records
    const loadUserScannedNotes = async () => {
      try {
        const records = await getPhotoRecords(uid);
        if (records && records.length > 0) {
          setFolders((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const newFolders = [...prev];

            records.forEach((rec, idx) => {
              const recFolderId = `scanned_${rec.id}`;
              if (!existingIds.has(recFolderId)) {
                newFolders.push({
                  id: recFolderId,
                  name: rec.regions?.[0]?.label ? rec.regions[0].label : `Note Scan #${records.length - idx}`,
                  icon: "📸",
                  itemCount: rec.cards?.length || 1,
                  lastStudied: "Just now",
                  color: ["yellow", "mint", "peach", "lavender", "blue"][idx % 5],
                  decoration: "tape",
                  rotation: (Math.random() - 0.5) * 3,
                  x: 210 + (newFolders.length % 4) * 190,
                  y: 90 + Math.floor(newFolders.length / 4) * 210,
                  zIndex: 1,
                  cards: rec.cards || [],
                  regions: rec.regions || [],
                  photoUrl: rec.originalPhotoUrl || null,
                  isScannedNote: true,
                });
              }
            });

            localStorage.setItem(storageKey, JSON.stringify(newFolders));
            return newFolders;
          });
        }
      } catch (err) {
        console.warn("Failed to sync scanned notes to canvas:", err);
      }
    };

    loadUserScannedNotes();
  }, [uid, storageKey]);

  const saveAndSetFolders = (updater) => {
    setFolders((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist folders to localStorage:", e);
      }
      return next;
    });
  };

  const handleFolderClick = (folder) => {
    navigate("folder", {
      folder,
      breadcrumb: [
        { label: "My Space", page: "canvas" },
        { label: folder.name },
      ],
    });
  };

  const handleDragEnd = (id, nx, ny) => {
    saveAndSetFolders((prev) => prev.map((f) => (f.id === id ? { ...f, x: nx, y: ny } : f)));
  };

  const handleDelete = (id) => {
    saveAndSetFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRename = (id, name) => {
    saveAndSetFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  };

  const handleDuplicate = (id) => {
    const src = folders.find((f) => f.id === id);
    if (!src) return;
    saveAndSetFolders((prev) => [
      ...prev,
      {
        ...src,
        id: `f${Date.now()}`,
        name: src.name + " (copy)",
        x: src.x + 20,
        y: src.y + 20,
      },
    ]);
  };

  const handleColorChange = (id, color) => {
    saveAndSetFolders((prev) => prev.map((f) => (f.id === id ? { ...f, color } : f)));
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const colors = ["yellow", "pink", "blue", "green", "lavender", "mint", "peach"];
    saveAndSetFolders((prev) => [
      ...prev,
      {
        id: `f${Date.now()}`,
        name: newFolderName.trim(),
        icon: newFolderIcon,
        itemCount: 0,
        lastStudied: "Never",
        color: colors[prev.length % colors.length],
        decoration: "tape",
        rotation: (Math.random() - 0.5) * 4,
        x: 220 + (prev.length % 4) * 190,
        y: 90 + Math.floor(prev.length / 4) * 210,
        zIndex: 1,
      },
    ]);
    setNewFolderName("");
    setNewFolderIcon("📁");
    setShowNewFolderModal(false);
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-paper overflow-hidden">
      <Header />

      <div className="flex flex-1 min-h-0 relative">
        {/* Canvas */}
        <div ref={canvasRef} className="canvas-bg flex-1 relative overflow-hidden">

          {/* Canvas title area */}
          <div className="absolute top-8 left-8 z-10 pointer-events-none">
            <h1 className="font-hand text-4xl font-bold text-ink mb-1" style={{ fontFamily: "'Caveat', cursive" }}>
              My Study Canvas
              <span className="inline-block ml-2 text-2xl animate-pulse-slow">✦</span>
            </h1>
            <p className="text-sm text-ink-secondary font-medium" style={{ fontFamily: "'Caveat', cursive", fontSize: 16 }}>
              Organize your study space, your way.
            </p>
            {/* Decorative arrow */}
            <svg className="mt-1 ml-2" width="40" height="30" viewBox="0 0 40 30" fill="none">
              <path d="M2 2 Q20 4 35 20" stroke="#C8C4BC" strokeWidth="1.5" strokeDasharray="3 2" fill="none" strokeLinecap="round"/>
              <path d="M30 18 L35 20 L32 25" stroke="#C8C4BC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>

          {/* Sticky notes */}
          {folders.map(folder => (
            <StickyNote
              key={folder.id}
              folder={folder}
              x={folder.x}
              y={folder.y}
              rotation={folder.rotation}
              onClick={handleFolderClick}
              onDragEnd={handleDragEnd}
              onDelete={handleDelete}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onColorChange={handleColorChange}
            />
          ))}

          {/* Create folder dashed placeholder */}
          <div
            className="absolute border-2 border-dashed border-ink-light rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
            style={{ width: 160, minHeight: 172, left: 970, top: 90 }}
            onClick={() => { setCreateOpen(true); setShowNewFolderModal(true); }}
          >
            <svg className="w-6 h-6 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-xs text-ink-tertiary text-center leading-tight px-2">Create<br/>a new folder</p>
          </div>

          {/* Study Streak widget */}
          <div className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-card border border-paper-border p-4 w-52 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">Study Streak</p>
                  <p className="text-2xl font-bold text-ink leading-none">7 <span className="text-sm font-medium text-ink-secondary">days</span></p>
                </div>
              </div>
              <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-paper-warm text-ink-tertiary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {WEEK_DAYS.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-ink-tertiary font-medium">{d}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    STREAK_DONE[i]
                      ? "bg-accent text-white"
                      : "bg-paper-warm border border-paper-border"
                  }`}>
                    {STREAK_DONE[i] && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip of the day widget */}
          <div className="absolute bottom-6 right-20 bg-white rounded-2xl shadow-card border border-paper-border p-4 w-56 animate-fade-in">
            <p className="text-xs font-semibold text-ink-secondary mb-2">Tip of the day</p>
            <p className="text-sm text-ink leading-relaxed">
              "The more you review,<br/>the more you remember."
            </p>
            {/* Decorative leaf */}
            <div className="absolute bottom-3 right-3 text-2xl opacity-20 rotate-12">🌿</div>
          </div>
        </div>

        {/* Create New floating panel */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20" style={{ top: "50%", transform: "translateY(-50%)" }}>
          <div className="bg-white rounded-2xl shadow-panel border border-paper-border p-4 w-44 animate-slide-up">
            <button
              id="create-new-btn"
              onClick={() => setCreateOpen(o => !o)}
              className="flex items-center gap-2 font-semibold text-sm text-accent mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              Create New
            </button>

            {(createOpen || true) && (
              <div className="space-y-0.5">
                {[
                  { icon: "📁", label: "New Folder", action: () => setShowNewFolderModal(true) },
                  { icon: "🖼️", label: "Upload Image", action: () => navigate("capture-image") },
                  { icon: "📄", label: "Upload File", action: () => navigate("capture-file") },
                  { icon: "📝", label: "Create Note", action: () => navigate("notes", { chapter: { id: "new", name: "New Note" }, breadcrumb: [{ label: "My Space", page: "canvas" }, { label: "New Note" }] }) },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm text-ink hover:bg-paper-warm transition-colors text-left"
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <div className="h-px bg-paper-border my-1.5" />
                {[
                  { icon: "🃏", label: "New Flashcards", action: () => navigate("notes", { activeTab: "flashcards" }) },
                  { icon: "❓", label: "New Quiz", action: () => navigate("notes", { activeTab: "quizzes" }) },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm text-ink hover:bg-paper-warm transition-colors text-left"
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas toolbar (right edge) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 bg-white rounded-2xl shadow-panel border border-paper-border p-1.5">
          {[
            { icon: "✋", title: "Pan" },
            { icon: "⊹", title: "Select" },
            { icon: "⊕", title: "Zoom In" },
            { icon: "⊖", title: "Zoom Out" },
            { icon: "⛶", title: "Fit to screen" },
          ].map((tool, i) => (
            <button
              key={i}
              title={tool.title}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-paper-warm text-ink-secondary text-sm font-medium transition-colors"
            >
              {tool.icon}
            </button>
          ))}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-panel border border-paper-border p-6 w-80 animate-scale-in">
            <h3 className="font-semibold text-ink mb-4">New Folder</h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Icon (emoji)"
                value={newFolderIcon}
                onChange={e => setNewFolderIcon(e.target.value)}
                className="w-16 text-center border border-paper-border rounded-xl px-2 py-2.5 text-lg outline-none focus:border-accent"
              />
              <input
                autoFocus
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createFolder()}
                className="flex-1 border border-paper-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent text-ink placeholder-ink-tertiary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNewFolderModal(false); setNewFolderName(""); }}
                className="px-4 py-2 text-sm text-ink-secondary hover:bg-paper-warm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 text-sm bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
