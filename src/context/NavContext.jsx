import { createContext, useContext, useState } from "react";

/**
 * Global navigation context for StudySnap.
 * Replaces react-router for this single-page app.
 *
 * Pages:
 *  - "landing"   → public landing page
 *  - "login"     → login screen
 *  - "signup"    → signup screen
 *  - "canvas"    → My Study Canvas (main dashboard)
 *  - "folder"    → a subject folder canvas (e.g. Science)
 *  - "chapter"   → a chapter canvas inside a folder
 *  - "notes"     → Notes/Flashcards/Quizzes workspace
 */

const NavContext = createContext(null);

export function NavProvider({ children }) {
  const [page, setPage] = useState("landing");
  // Breadcrumb stack: [{id, label, page}]
  const [breadcrumb, setBreadcrumb] = useState([]);
  // Active folder/chapter context
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeTab, setActiveTab] = useState("notes"); // notes | flashcards | quizzes

  const navigate = (target, opts = {}) => {
    setPage(target);
    if (opts.folder) setActiveFolder(opts.folder);
    if (opts.chapter) setActiveChapter(opts.chapter);
    if (opts.tab) setActiveTab(opts.tab);
    if (opts.breadcrumb) setBreadcrumb(opts.breadcrumb);
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
