import { useNav } from "../../context/NavContext";

export default function Breadcrumb({ items }) {
  const { navigate } = useNav();

  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-ink-tertiary">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <svg className="w-3.5 h-3.5 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.page ? (
            <button
              onClick={() => navigate(item.page, item.opts || {})}
              className="hover:text-ink hover:underline underline-offset-2 transition-colors font-medium"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-ink font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
