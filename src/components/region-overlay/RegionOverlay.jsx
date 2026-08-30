import { useState } from "react";
import { normalizeBox } from "../../utils/coordinates";

/** Color map for region types with border, bg, badge styles */
export const REGION_COLORS = {
  equation: {
    border: "border-blue-500",
    bg: "bg-blue-500/15",
    activeBorder: "border-blue-500 ring-2 ring-blue-400/50 shadow-md",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    name: "Equation",
  },
  diagram: {
    border: "border-emerald-500",
    bg: "bg-emerald-500/15",
    activeBorder: "border-emerald-500 ring-2 ring-emerald-400/50 shadow-md",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    name: "Diagram",
  },
  definition: {
    border: "border-purple-500",
    bg: "bg-purple-500/15",
    activeBorder: "border-purple-500 ring-2 ring-purple-400/50 shadow-md",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    name: "Definition",
  },
  list: {
    border: "border-orange-500",
    bg: "bg-orange-500/15",
    activeBorder: "border-orange-500 ring-2 ring-orange-400/50 shadow-md",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    name: "List",
  },
  prose: {
    border: "border-ink-tertiary",
    bg: "bg-ink/5",
    activeBorder: "border-ink ring-2 ring-ink/20 shadow-md",
    badge: "bg-paper-warm text-ink border-paper-border",
    dot: "bg-ink-secondary",
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
    <div className={`relative w-full select-none overflow-hidden rounded-2xl border border-paper-border bg-white shadow-card ${className}`}>
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
                  : `${typeStyle.border} bg-black/5 hover:${typeStyle.bg} z-10 opacity-90 hover:opacity-100`
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
                className={`absolute -top-3.5 left-2 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-sm backdrop-blur-md transition-transform ${
                  isSelected || isHovered ? "scale-105" : "scale-95 opacity-90"
                } ${typeStyle.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`} />
                <span>{typeStyle.name}</span>
              </div>

              {/* Hover / Active tooltip */}
              {(isHovered || isSelected) && (
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-xs -translate-x-1/2 rounded-xl border border-paper-border bg-white/95 p-2.5 text-left text-xs shadow-panel backdrop-blur-md z-40 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <span className={`h-2 w-2 rounded-full ${typeStyle.dot}`} />
                    <span>{region.label}</span>
                  </div>
                  {region.raw_text && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-ink-secondary font-mono">
                      {region.raw_text}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-accent font-medium">
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

