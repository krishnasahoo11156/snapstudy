import { useState } from "react";
import { useNav } from "../../context/NavContext";
import StickyNote from "./StickyNote";
import Header from "../ui/Header";
import Breadcrumb from "../ui/Breadcrumb";

const SCIENCE_CHAPTERS = [
  { id: "c1", name: "Chapter 1\nMotion", icon: "🏃", itemCount: 4, lastStudied: "Today", color: "yellow", decoration: "tape", rotation: -2, x: 200, y: 120, zIndex: 1 },
  { id: "c2", name: "Chapter 2\nLaws of Motion", icon: "⚡", itemCount: 2, lastStudied: "Yesterday", color: "pink", decoration: "pin", pinColor: "#DC2626", rotation: 1.5, x: 390, y: 110, zIndex: 1 },
  { id: "c3", name: "Chapter 3\nGravitation", icon: "🌍", itemCount: 1, lastStudied: "3 days ago", color: "blue", decoration: "tape-sideways", rotation: -1, x: 580, y: 125, zIndex: 1 },
  { id: "c4", name: "Formula Sheet", icon: "📐", itemCount: 1, lastStudied: "1 week ago", color: "green", decoration: "tape", rotation: 2, x: 200, y: 320, zIndex: 1 },
];

export default function FolderCanvas() {
  const { navigate, activeFolder, breadcrumb } = useNav();
  const folder = activeFolder || { id: "f1", name: "Science", icon: "⚛️" };
  const [chapters, setChapters] = useState(SCIENCE_CHAPTERS);
  const [showCreate, setShowCreate] = useState(false);

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
    setChapters(prev => prev.map(c => c.id === id ? { ...c, x: nx, y: ny } : c));
  };
  const handleDelete = (id) => setChapters(prev => prev.filter(c => c.id !== id));
  const handleRename = (id, name) => setChapters(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  const handleDuplicate = (id) => {
    const src = chapters.find(c => c.id === id);
    if (!src) return;
    setChapters(prev => [...prev, { ...src, id: `c${Date.now()}`, name: src.name + " (copy)", x: src.x + 20, y: src.y + 20 }]);
  };
  const handleColorChange = (id, color) => setChapters(prev => prev.map(c => c.id === id ? { ...c, color } : c));

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
              <h1 className="font-bold text-3xl text-ink flex items-center gap-2">
                {folder.name}
                <span className="text-2xl">{folder.icon}</span>
              </h1>
              <button
                onClick={() => setChapters(prev => [...prev, {
                  id: `c${Date.now()}`,
                  name: "New Chapter",
                  icon: "📌",
                  itemCount: 0,
                  lastStudied: "Never",
                  color: ["yellow","pink","blue","green","lavender","mint","peach"][prev.length % 7],
                  decoration: "tape",
                  rotation: (Math.random()-0.5)*4,
                  x: 200 + (prev.length%4)*190,
                  y: 120 + Math.floor(prev.length/4)*210,
                  zIndex: 1,
                }])}
                className="pointer-events-auto"
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
              onClick={() => setShowCreate(o => !o)}
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
                  { icon: "📁", label: "New Chapter" },
                  { icon: "🖼️", label: "Upload Image" },
                  { icon: "📄", label: "Upload File" },
                  { icon: "📝", label: "Create Note" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink hover:bg-paper-warm transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chapter sticky notes */}
          {chapters.map(chapter => (
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
            className="absolute border-2 border-dashed border-ink-light rounded-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
            style={{ width: 160, minHeight: 172, left: 390 + 190 * 2, top: 120 }}
          >
            <svg className="w-6 h-6 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-xs text-ink-tertiary text-center leading-tight px-2">Create folder<br/>or upload</p>
          </div>
        </div>

        {/* Canvas toolbar */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 bg-white rounded-2xl shadow-panel border border-paper-border p-1.5">
          {["✋","⊹","⊕","⊖","⛶"].map((icon, i) => (
            <button key={i} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-paper-warm text-ink-secondary text-sm transition-colors">{icon}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
