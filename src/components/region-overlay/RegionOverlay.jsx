import { useState } from "react";
import { normalizeBox } from "../../utils/coordinates";

/** Color map for region types with border, bg, badge styles */
export const REGION_COLORS = {
  equation: {
    border: "border-blue-500",
    bg: "bg-blue-500/15",
    activeBorder: "border-blue-400 ring-2 ring-blue-400/50 shadow-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    dot: "bg-blue-400",
    name: "Equation",
  },
  diagram: {
    border: "border-emerald-500",
    bg: "bg-emerald-500/15",
    activeBorder: "border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    dot: "bg-emerald-400",
    name: "Diagram",
  },
  definition: {
    border: "border-purple-500",
    bg: "bg-purple-500/15",
    activeBorder: "border-purple-400 ring-2 ring-purple-400/50 shadow-purple-500/30",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    dot: "bg-purple-400",
    name: "Definition",
  },
  list: {
    border: "border-orange-500",
    bg: "bg-orange-500/15",
    activeBorder: "border-orange-400 ring-2 ring-orange-400/50 shadow-orange-500/30",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    dot: "bg-orange-400",
    name: "List",
  },
  prose: {
    border: "border-slate-400",
    bg: "bg-slate-400/15",
    activeBorder: "border-slate-300 ring-2 ring-slate-300/50 shadow-slate-500/30",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    dot: "bg-slate-400",
    name: "Prose",
  },
};

/**
 * RegionOverlay — renders the original photo with responsive, interactive bounding boxes.
 *
 * @param {{
 *   src: string,
 *   regions: import("../../types").Region[],
 *   selectedRegionId?: string,
 *   onSelectRegion?: (region: import("../../types").Region) => void,
 *   className?: string
 * }} props
 */
export default function RegionOverlay({
  src,
  regions = [],
  selectedRegionId = null,
  onSelectRegion = null,
  className = "",
}) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className={`relative w-full select-none overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/60 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Original Image */}
      <img
        src={src}
        alt="Student notes"
        className="block h-auto w-full object-contain"
      />

      {/* Bounding box layer */}
      <div className="absolute inset-0 pointer-events-auto">
        {regions.map((region) => {
          const typeStyle = REGION_COLORS[region.region_type] || REGION_COLORS.prose;
          const box = normalizeBox(region.box_2d);

          const left = `${box.xmin / 10}%`;
          const top = `${box.ymin / 10}%`;
          const width = `${Math.max(2, (box.xmax - box.xmin) / 10)}%`;
          const height = `${Math.max(2, (box.ymax - box.ymin) / 10)}%`;

          const isSelected = selectedRegionId === region.id;
          const isHovered = hoveredId === region.id;

          return (
            <div
              key={region.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRegion?.(region);
              }}
              onMouseEnter={() => setHoveredId(region.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`absolute cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? `${typeStyle.activeBorder} ${typeStyle.bg} z-30 shadow-lg scale-[1.01]`
                  : isHovered
                  ? `${typeStyle.border} ${typeStyle.bg} z-20 shadow-md`
                  : `${typeStyle.border} bg-black/10 hover:${typeStyle.bg} z-10 opacity-90 hover:opacity-100`
              }`}
              style={{
                left,
                top,
                width,
                height,
              }}
            >
              {/* Type pill / Region identifier tag */}
              <div
                className={`absolute -top-3.5 left-2 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-md backdrop-blur-md transition-transform ${
                  isSelected || isHovered ? "scale-105" : "scale-95 opacity-80"
                } ${typeStyle.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`} />
                <span>{typeStyle.name}</span>
              </div>

              {/* Hover / Active tooltip */}
              {(isHovered || isSelected) && (
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-xs -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-left text-xs shadow-2xl backdrop-blur-md z-40 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-slate-100">
                    <span className={`h-2 w-2 rounded-full ${typeStyle.dot}`} />
                    <span>{region.label}</span>
                  </div>
                  {region.raw_text && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-400 font-mono">
                      {region.raw_text}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-blue-400">
                    {isSelected ? "Currently selected" : "Click to view linked flashcard"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

