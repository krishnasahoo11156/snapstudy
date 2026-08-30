import { useState } from "react";
import { useNav } from "../../context/NavContext";
import StickyNote from "./StickyNote";
import Header from "../ui/Header";
import Breadcrumb from "../ui/Breadcrumb";
import {
  FolderPlus,
  Image as ImageIcon,
  FileText,
  PenTool,
  StudyIcon,
  Hand,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "../ui/Icons";

const SCIENCE_CHAPTERS = [
  { id: "c1", name: "Chapter 1\nMotion", icon: "motion", itemCount: 4, lastStudied: "Today", color: "yellow", decoration: "tape", rotation: -2, x: 200, y: 120, zIndex: 1 },
  { id: "c2", name: "Chapter 2\nLaws of Motion", icon: "lightning", itemCount: 2, lastStudied: "Yesterday", color: "pink", decoration: "pin", pinColor: "#DC2626", rotation: 1.5, x: 390, y: 110, zIndex: 1 },
  { id: "c3", name: "Chapter 3\nGravitation", icon: "globe", itemCount: 1, lastStudied: "3 days ago", color: "blue", decoration: "tape-sideways", rotation: -1, x: 580, y: 125, zIndex: 1 },
  { id: "c4", name: "Formula Sheet", icon: "math", itemCount: 1, lastStudied: "1 week ago", color: "green", decoration: "tape", rotation: 2, x: 200, y: 320, zIndex: 1 },
];

export default function FolderCanvas() {
  const { navigate, activeFolder, breadcrumb } = useNav();
  const folder = activeFolder || { id: "f1", name: "Science", icon: "science" };
  const storageKey = `snapstudy_chapters_${folder.id}`;

  const [chapters, setChapters] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load chapters from localStorage:", e);
    }

    if (folder.isScannedNote && folder.cards) {
      return [
        {
          id: `c_${folder.id}`,
          name: folder.name,
          icon: folder.icon || "camera",
          itemCount: folder.cards.length,
          lastStudied: "Today",
          color: folder.color || "yellow",
          decoration: "tape",
          rotation: 0,
          x: 200,
          y: 120,
          zIndex: 1,
          cards: folder.cards,
          regions: folder.regions,
          photoUrl: folder.photoUrl,
        },
      ];
    }

    return SCIENCE_CHAPTERS;
  });

  const [showCreate, setShowCreate] = useState(false);

  const saveAndSetChapters = (updater) => {
    setChapters((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save chapters:", e);
      }
      return next;
    });
  };

  const bc = breadcrumb?.length ? breadcrumb : [
    { label: "My Space", page: "canvas" },
    { label: folder.name },
  ];

  const handleChapterClick = (chapter) => {
    navigate("notes", {
      chapter,
      folder,
      breadcrumb: [
        { label: "My Space", page: "canvas" },
        { label: folder.name, page: "folder", opts: { folder, breadcrumb: bc } },
        { label: chapter.name.replace("\n", " ") },
      ],
    });
  };

  const handleDragEnd = (id, nx, ny) => {
    saveAndSetChapters((prev) => prev.map((c) => (c.id === id ? { ...c, x: nx, y: ny } : c)));
  };
  const handleDelete = (id) => saveAndSetChapters((prev) => prev.filter((c) => c.id !== id));
  const handleRename = (id, name) => saveAndSetChapters((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  const handleDuplicate = (id) => {
    const src = chapters.find((c) => c.id === id);
    if (!src) return;
    saveAndSetChapters((prev) => [...prev, { ...src, id: `c${Date.now()}`, name: src.name + " (copy)", x: src.x + 20, y: src.y + 20 }]);
  };
  const handleColorChange = (id, color) => saveAndSetChapters((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)));

  const handleCreateChapter = () => {
    saveAndSetChapters((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        name: "New Chapter",
        icon: "pin",
        itemCount: 0,
        lastStudied: "Never",
        color: ["yellow", "pink", "blue", "green", "lavender", "mint", "peach"][prev.length % 7],
        decoration: "tape",
        rotation: (Math.random() - 0.5) * 4,
        x: 200 + (prev.length % 4) * 190,
        y: 120 + Math.floor(prev.length / 4) * 210,
        zIndex: 1,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-paper overflow-hidden">
      <Header />

      <div className="flex flex-1 min-h-0 relative">
        {/* Canvas */}
        <div className="canvas-bg flex-1 relative overflow-hidden">

          {/* Top area */}
          <div className="absolute top-6 left-8 z-10 pointer-events-none">
            <div className="pointer-events-auto mb-2">
              <Breadcrumb items={bc.slice(0, -1).concat({ label: bc[bc.length - 1]?.label })} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="font-bold text-3xl text-ink flex items-center gap-2.5">
                <span>{folder.name}</span>
                <StudyIcon name={folder.icon} className="w-6 h-6 text-accent shrink-0" />
              </h1>
              <button
                onClick={handleCreateChapter}
                className="pointer-events-auto"
                title="Add Chapter"
              >
                <svg className="w-4 h-4 text-ink-tertiary hover:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-ink-secondary mt-1" style={{ fontFamily: "'Caveat', cursive", fontSize: 16 }}>
              Build your concepts, one chapter at a time.
            </p>
          </div>

          {/* + Create button */}
          <div className="absolute top-6 right-6 z-10">
            <button
              id="folder-create-btn"
              onClick={() => setShowCreate((o) => !o)}
              className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/80 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create
            </button>
            {showCreate && (
              <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-panel border border-paper-border p-2 w-44 animate-slide-down">
                {[
                  { icon: <FolderPlus className="w-4 h-4 text-blue-500" />, label: "New Chapter", action: handleCreateChapter },
                  { icon: <ImageIcon className="w-4 h-4 text-emerald-500" />, label: "Upload Image", action: () => navigate("capture-image") },
                  { icon: <FileText className="w-4 h-4 text-amber-500" />, label: "Upload File", action: () => navigate("capture-file") },
                  { icon: <PenTool className="w-4 h-4 text-indigo-500" />, label: "Create Note", action: () => navigate("notes", { chapter: { id: "new", name: "New Note" }, breadcrumb: [...bc, { label: "New Note" }] }) },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { setShowCreate(false); item.action(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink hover:bg-paper-warm transition-colors text-left"
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chapter sticky notes */}
          {chapters.map((chapter) => (
            <StickyNote
              key={chapter.id}
              folder={chapter}
              x={chapter.x}
              y={chapter.y}
              rotation={chapter.rotation}
              onClick={handleChapterClick}
              onDragEnd={handleDragEnd}
              onDelete={handleDelete}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onColorChange={handleColorChange}
            />
          ))}

          {/* Dashed "create or upload" placeholder */}
          <div
            onClick={() => navigate("capture-image")}
            className="absolute border-2 border-dashed border-ink-light rounded-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
            style={{ width: 160, minHeight: 172, left: 390 + 190 * 2, top: 120 }}
          >
            <svg className="w-6 h-6 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-xs text-ink-tertiary text-center leading-tight px-2">Upload or scan<br/>study notes</p>
          </div>
        </div>

        {/* Canvas toolbar */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 bg-white rounded-2xl shadow-panel border border-paper-border p-1.5">
          {[
            { icon: <Hand className="w-4 h-4" />, title: "Pan" },
            { icon: <Move className="w-4 h-4" />, title: "Select" },
            { icon: <ZoomIn className="w-4 h-4" />, title: "Zoom In" },
            { icon: <ZoomOut className="w-4 h-4" />, title: "Zoom Out" },
            { icon: <Maximize2 className="w-4 h-4" />, title: "Fit to screen" },
          ].map((item, i) => (
            <button key={i} title={item.title} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-paper-warm text-ink-secondary text-sm transition-colors">
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
