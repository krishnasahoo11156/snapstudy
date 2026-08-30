import { useState, useRef, useCallback } from "react";

/**
 * Draggable sticky note that looks like a physical Post-it.
 *
 * Props:
 *  - folder: { id, name, icon, itemCount, lastStudied, color, decoration }
 *  - x, y: initial position on canvas
 *  - rotation: initial rotation in degrees
 *  - onDragEnd(id, x, y): called when drag finishes
 *  - onClick(folder): called when note is clicked (not dragged)
 *  - onDelete, onRename, onDuplicate, onColorChange
 */

const NOTE_COLORS = {
  yellow:   { bg: "#FFF3A3", border: "#F5E642", text: "#7A6800" },
  pink:     { bg: "#FFD6D6", border: "#FFB3B3", text: "#8B1A1A" },
  blue:     { bg: "#D6EAFF", border: "#93C5FD", text: "#1A4A7A" },
  green:    { bg: "#D4EDDA", border: "#86EFAC", text: "#14532D" },
  lavender: { bg: "#E8D5FF", border: "#C4B5FD", text: "#4C1D95" },
  mint:     { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
  peach:    { bg: "#FFE4CC", border: "#FDBA74", text: "#7C2D12" },
};

const COLOR_NAMES = Object.keys(NOTE_COLORS);

export default function StickyNote({
  folder,
  x = 0,
  y = 0,
  rotation = 0,
  onDragEnd,
  onClick,
  onDelete,
  onRename,
  onDuplicate,
  onColorChange,
}) {
  const [pos, setPos] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(folder.name);
  const dragStart = useRef(null);
  const hasMoved = useRef(false);
  const noteRef = useRef(null);

  const color = NOTE_COLORS[folder.color] || NOTE_COLORS.yellow;
  const decoration = folder.decoration || "tape";

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setContextMenu(null);
    hasMoved.current = false;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: pos.x,
      oy: pos.y,
    };
    setIsDragging(true);

    const onMove = (mv) => {
      const dx = mv.clientX - dragStart.current.mx;
      const dy = mv.clientY - dragStart.current.my;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
      setPos({
        x: dragStart.current.ox + dx,
        y: dragStart.current.oy + dy,
      });
    };
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (!hasMoved.current) {
        onClick && onClick(folder);
      } else {
        onDragEnd && onDragEnd(folder.id, dragStart.current.ox + (window.event?.clientX - dragStart.current.mx || 0), dragStart.current.oy + (window.event?.clientY - dragStart.current.my || 0));
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [pos, folder, onClick, onDragEnd]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e) => {
    if (hasMoved.current) return;
    onClick && onClick(folder);
  };

  const closeContext = () => setContextMenu(null);

  return (
    <>
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[200] bg-white rounded-xl shadow-panel border border-paper-border py-1.5 w-44 animate-scale-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={closeContext}
        >
          {[
            { label: "Open folder", icon: "📂", action: () => { onClick && onClick(folder); closeContext(); } },
            { label: "Rename", icon: "✏️", action: () => { setRenaming(true); closeContext(); } },
            { label: "Duplicate", icon: "⧉", action: () => { onDuplicate && onDuplicate(folder.id); closeContext(); } },
            { label: "Change color", icon: "🎨", sub: true },
            { label: "Delete", icon: "🗑️", action: () => { onDelete && onDelete(folder.id); closeContext(); }, danger: true },
          ].map((item, i) => (
            <div key={i}>
              {i === 3 && <div className="h-px bg-paper-border my-1" />}
              {item.sub ? (
                <div className="px-3 py-1.5">
                  <p className="text-xs text-ink-tertiary mb-1.5 font-medium">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_NAMES.map(c => (
                      <button
                        key={c}
                        onClick={() => { onColorChange && onColorChange(folder.id, c); closeContext(); }}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ background: NOTE_COLORS[c].bg, borderColor: NOTE_COLORS[c].border }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={item.action}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-paper-warm rounded transition-colors ${item.danger ? "text-red-600" : "text-ink"}`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sticky Note */}
      <div
        ref={noteRef}
        id={`note-${folder.id}`}
        className={`sticky-note select-none ${isDragging ? "dragging" : ""} folded-corner`}
        style={{
          left: pos.x,
          top: pos.y,
          width: 160,
          minHeight: 172,
          background: color.bg,
          border: `1.5px solid ${color.border}`,
          transform: `rotate(${rotation}deg)`,
          zIndex: isDragging ? 100 : folder.zIndex || 1,
          padding: "28px 14px 18px",
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {/* Decoration: tape or pin */}
        {decoration === "tape" && (
          <div className="tape" style={{ background: "rgba(255,255,255,0.5)", borderColor: color.border }} />
        )}
        {decoration === "pin" && (
          <div className="pin" style={{ background: folder.pinColor || "#E53E3E" }} />
        )}
        {decoration === "tape-sideways" && (
          <div className="tape" style={{ transform: "translateX(-50%) rotate(5deg)", background: "rgba(255,255,255,0.5)" }} />
        )}

        {/* Content */}
        {renaming ? (
          <input
            autoFocus
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={() => { setRenaming(false); onRename && onRename(folder.id, renameVal); }}
            onKeyDown={e => { if (e.key === "Enter") { setRenaming(false); onRename && onRename(folder.id, renameVal); } }}
            onMouseDown={e => e.stopPropagation()}
            className="w-full bg-transparent text-center font-bold text-base outline-none border-b-2"
            style={{ color: color.text, borderColor: color.border, fontFamily: "'Caveat', cursive", fontSize: 20 }}
          />
        ) : (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-2">
              <span className="text-2xl">{folder.icon}</span>
            </div>
            {/* Name */}
            <p
              className="text-center font-bold leading-snug mb-3"
              style={{ color: color.text, fontFamily: "'Caveat', cursive", fontSize: 20 }}
            >
              {folder.name}
            </p>
            {/* Meta */}
            <div className="text-center" style={{ color: color.text, opacity: 0.75 }}>
              <p className="text-xs font-medium">{folder.itemCount} items</p>
              <p className="text-xs mt-0.5">Last studied</p>
              <p className="text-xs">{folder.lastStudied}</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export { NOTE_COLORS, COLOR_NAMES };
