import { normalizedToPixel } from "../../utils/coordinates";

/** Color map for region types */
const REGION_COLORS = {
  equation: { border: "#60a5fa", bg: "rgba(96,165,250,0.08)", label: "text-blue-400" },
  diagram: { border: "#34d399", bg: "rgba(52,211,153,0.08)", label: "text-emerald-400" },
  definition: { border: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "text-violet-400" },
  list: { border: "#fb923c", bg: "rgba(251,146,60,0.08)", label: "text-orange-400" },
  prose: { border: "#94a3b8", bg: "rgba(148,163,184,0.08)", label: "text-slate-400" },
};

/**
 * RegionOverlay — renders the original photo with colored bounding boxes.
 * Branch A owns the full implementation; this baseline version renders mock data.
 *
 * @param {{ src: string, regions: import("../../types").Region[], imgWidth: number, imgHeight: number }} props
 */
export default function RegionOverlay({ src, regions = [], imgWidth = 1000, imgHeight = 1000 }) {
  return (
    <div className="relative inline-block w-full">
      <img
        src={src}
        alt="Student notes"
        className="w-full rounded-xl"
        onLoad={(e) => {
          // Region boxes are absolute-positioned relative to the rendered image size
          const img = e.currentTarget;
          img.parentElement.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`;
        }}
      />

      {/* Bounding boxes */}
      {regions.map((region) => {
        const colors = REGION_COLORS[region.region_type] || REGION_COLORS.prose;
        const px = normalizedToPixel(region.box_2d, imgWidth, imgHeight);

        return (
          <div
            key={region.id}
            title={region.label}
            className="absolute rounded cursor-pointer transition-all duration-200 hover:shadow-lg group"
            style={{
              left: `${(px.x / imgWidth) * 100}%`,
              top: `${(px.y / imgHeight) * 100}%`,
              width: `${(px.width / imgWidth) * 100}%`,
              height: `${(px.height / imgHeight) * 100}%`,
              border: `2px solid ${colors.border}`,
              background: colors.bg,
            }}
          >
            {/* Label tooltip on hover */}
            <span className={`absolute -top-6 left-0 hidden group-hover:block text-xs font-semibold whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 shadow-lg ${colors.label}`}>
              {region.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
