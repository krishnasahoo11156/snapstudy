import { createContext, useContext, useState, useEffect } from "react";

/**
 * URL Path ↔ Page Mapping
 */
const PATH_TO_PAGE = {
  "/": "landing",
  "/landing": "landing",
  "/login": "login",
  "/signin": "login",
  "/signup": "signup",
  "/register": "signup",
  "/canvas": "canvas",
  "/study": "canvas",
  "/capture": "capture-image",
  "/capture-image": "capture-image",
  "/capture-file": "capture-file",
  "/folder": "folder",
  "/chapter": "folder",
  "/notes": "notes",
  "/flashcards": "notes",
  "/quizzes": "notes",
};

const PAGE_TO_PATH = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  canvas: "/canvas",
  "capture-image": "/capture",
  "capture-file": "/capture",
  folder: "/folder",
  chapter: "/folder",
  notes: "/notes",
};

const getPageFromPath = (path) => {
  if (!path) return "landing";
  const clean = path.toLowerCase().replace(/\/+$/, "") || "/";
  return PATH_TO_PAGE[clean] || "landing";
};

const NavContext = createContext(null);

export function NavProvider({ children }) {
  const [page, setPage] = useState(() => {
    if (typeof window !== "undefined") {
      return getPageFromPath(window.location.pathname);
    }
    return "landing";
  });

  // Breadcrumb stack: [{id, label, page}]
  const [breadcrumb, setBreadcrumb] = useState([]);
  // Active folder/chapter context
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("flashcards")) return "flashcards";
      if (path.includes("quizzes")) return "quizzes";
    }
    return "notes";
  });

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const targetPage = getPageFromPath(window.location.pathname);
      setPage(targetPage);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (target, opts = {}) => {
    setPage(target);
    if (opts.folder) setActiveFolder(opts.folder);
    if (opts.chapter) setActiveChapter(opts.chapter);
    if (opts.tab) setActiveTab(opts.tab);
    if (opts.activeTab) setActiveTab(opts.activeTab);
    if (opts.breadcrumb) setBreadcrumb(opts.breadcrumb);

    // Sync URL in browser address bar
    if (typeof window !== "undefined") {
      const targetPath = PAGE_TO_PATH[target] || "/";
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page: target, ...opts }, "", targetPath);
      }
    }
  };

  return (
    <NavContext.Provider value={{
      page, navigate,
      breadcrumb, setBreadcrumb,
      activeFolder, setActiveFolder,
      activeChapter, setActiveChapter,
      activeTab, setActiveTab,
    }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
