import { useState, useEffect } from "react";
import { useNav } from "../../context/NavContext";
import Header from "../ui/Header";
import Breadcrumb from "../ui/Breadcrumb";
import FlashcardsWorkspace from "./FlashcardsWorkspace";
import QuizScreen from "../quiz/QuizScreen";
import { generateMockCards, generateMockRegions } from "../../data/mock-data";

/** Shared formatting toolbar button */
function ToolBtn({ label, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium text-ink-secondary hover:bg-paper-warm hover:text-ink transition-colors"
    >
      {label}
    </button>
  );
}

const MOCK_CARDS = generateMockCards().cards;
const MOCK_REGIONS = generateMockRegions().regions;

const NOTES_CONTENT = [
  {
    type: "heading",
    level: 1,
    text: "Motion",
  },
  {
    type: "section",
    number: "1",
    title: "Introduction",
    content: "Motion is the change in position of an object with respect to time. An object is said to be in motion if it changes its position relative to a reference point.",
  },
  {
    type: "key-point",
    text: "Key Point: Motion is always relative, i.e., it depends on the observer.",
  },
  {
    type: "section",
    number: "2",
    title: "Types of Motion",
    bullets: [
      { bold: "Rectilinear Motion", rest: " — motion along a straight line" },
      { bold: "Circular Motion", rest: " — motion along a circular path" },
      { bold: "Periodic Motion", rest: " — motion that repeats after a fixed interval of time" },
    ],
  },
  {
    type: "section",
    number: "3",
    title: "Important Formulae",
    formulas: [
      { formula: "v = u + at", label: "(Final velocity)" },
      { formula: "s = ut + ½at²", label: "(Displacement)" },
      { formula: "v² = u² + 2as", label: "(Velocity-displacement)" },
    ],
  },
  {
    type: "definition",
    title: "Uniform Motion",
    text: "When an object covers equal distances in equal intervals of time, it is said to be in uniform motion.",
  },
];

const AI_MESSAGES = [
  { role: "user", text: "What is the difference between speed and velocity?" },
  {
    role: "ai",
    text: "Speed describes how fast something moves, while velocity also includes the direction of motion.",
    context: "Based on your notes — Chapter 1: Motion",
    suggestions: ["Explain with an example", "Give me more key points", "Quiz me on this"],
  },
];

export default function NotesWorkspace() {
  const { navigate, activeChapter, breadcrumb, activeTab, setActiveTab, activeFolder, setActiveChapter } = useNav();
  const chapter = activeChapter || { id: "c1", name: "Chapter 1: Motion" };
  const effectiveCards = chapter.cards && chapter.cards.length > 0 ? chapter.cards : MOCK_CARDS;
  const effectiveRegions = chapter.regions && chapter.regions.length > 0 ? chapter.regions : MOCK_REGIONS;
  const photoUrl = chapter.photoUrl || null;

  const folderId = activeFolder?.id || "f1";
  const chaptersStorageKey = `snapstudy_chapters_${folderId}`;

  const [noteTitle, setNoteTitle] = useState(chapter.name || "");
  const [noteText, setNoteText] = useState(chapter.notesText || "");

  useEffect(() => {
    setNoteTitle(chapter.name || "");
    setNoteText(chapter.notesText || "");
  }, [chapter.id]);

  const handleUpdateNoteTitle = (newTitle) => {
    setNoteTitle(newTitle);
    const updatedChapter = { ...chapter, name: newTitle };
    setActiveChapter(updatedChapter);

    if (chapter.id !== "c1") {
      try {
        const cached = JSON.parse(localStorage.getItem(chaptersStorageKey) || "[]");
        const next = cached.map((c) => (c.id === chapter.id ? { ...c, name: newTitle } : c));
        localStorage.setItem(chaptersStorageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist updated note title:", e);
      }
    }
  };

  const handleUpdateNoteText = (newText) => {
    setNoteText(newText);
    const updatedChapter = { ...chapter, notesText: newText };
    setActiveChapter(updatedChapter);

    if (chapter.id !== "c1") {
      try {
        const cached = JSON.parse(localStorage.getItem(chaptersStorageKey) || "[]");
        const next = cached.map((c) => (c.id === chapter.id ? { ...c, notesText: newText } : c));
        localStorage.setItem(chaptersStorageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist updated note text:", e);
      }
    }
  };

  const bc = breadcrumb || [
    { label: "My Space", page: "canvas" },
    { label: "Science", page: "folder" },
    { label: chapter.name },
  ];

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState(AI_MESSAGES);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeFormat, setActiveFormat] = useState([]);

  const sendAiMessage = () => {
    if (!aiInput.trim()) return;
    const newMsg = { role: "user", text: aiInput };
    setAiMessages((prev) => [...prev, newMsg]);
    setAiInput("");
    setAiLoading(true);
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Based on your notes for ${chapter.name}: ${
            aiInput.toLowerCase().includes("formula")
              ? "The key formulas and steps are recorded in your flashcards."
              : "Reviewing your notes and flashcards will help solidify these concepts!"
          }`,
          context: `Based on your notes — ${chapter.name}`,
          suggestions: ["Explain key points", "Quiz me on this", "Show formulas"],
        },
      ]);
      setAiLoading(false);
    }, 1000);
  };

  const tab = activeTab || "notes";

  if (tab === "flashcards") {
    return (
      <div className="flex flex-col h-screen bg-paper">
        <Header />
        <WorkspaceTabs tab={tab} setTab={setActiveTab} bc={bc} chapter={chapter} cardCount={effectiveCards.length} />
        <FlashcardsWorkspace cards={effectiveCards} chapter={chapter} />
      </div>
    );
  }

  if (tab === "quizzes") {
    return (
      <div className="flex flex-col h-screen bg-paper">
        <Header />
        <WorkspaceTabs tab={tab} setTab={setActiveTab} bc={bc} chapter={chapter} cardCount={effectiveCards.length} />
        <div className="flex-1 overflow-y-auto p-6">
          <QuizScreen
            deck={{ title: chapter.name, cardCount: effectiveCards.length }}
            cards={effectiveCards}
            regions={effectiveRegions}
            photoUrl={photoUrl}
            onExit={() => setActiveTab("notes")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-paper">
      <Header />
      <WorkspaceTabs tab={tab} setTab={setActiveTab} bc={bc} chapter={chapter} />

      <div className="flex flex-1 min-h-0">
        {/* Notes editor - main area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-paper-border">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-4 py-2 border-b border-paper-border bg-white overflow-x-auto">
            {/* Font & size */}
            <select className="text-xs border border-paper-border rounded-lg px-2 py-1 text-ink mr-1 outline-none">
              <option>Inter</option>
              <option>Georgia</option>
              <option>Caveat</option>
            </select>
            <select className="text-xs border border-paper-border rounded-lg px-2 py-1 text-ink mr-2 outline-none">
              {[10,12,14,16,18,20,24].map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="w-px h-5 bg-paper-border mx-1" />
            {/* Heading */}
            {["H1","H2","H3"].map(h => (
              <ToolBtn key={h} label={h} onClick={() => {}} />
            ))}
            <div className="w-px h-5 bg-paper-border mx-1" />
            {/* Text style */}
            {[
              { icon: "B", title: "Bold", style: "font-bold" },
              { icon: "I", title: "Italic", style: "italic" },
              { icon: "U", title: "Underline", style: "underline" },
            ].map(b => (
              <ToolBtn key={b.title} label={<span className={b.style}>{b.icon}</span>} title={b.title} onClick={() => {}} />
            ))}
            <div className="w-px h-5 bg-paper-border mx-1" />
            {/* Lists */}
            <ToolBtn label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>} title="Bullets" onClick={() => {}} />
            <ToolBtn label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>} title="Numbered list" onClick={() => {}} />
            <div className="w-px h-5 bg-paper-border mx-1" />
            {/* Other tools */}
            <ToolBtn label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>} title="Link" onClick={() => {}} />
            <ToolBtn label="🖊" title="Highlight" onClick={() => {}} />
            <ToolBtn label="A" title="Text color" onClick={() => {}} />
            <ToolBtn label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} title="Image" onClick={() => {}} />
            <ToolBtn label="···" title="More" onClick={() => {}} />
          </div>

          {/* Notes content */}
          <div className="flex-1 overflow-y-auto p-8 max-w-2xl w-full">
            <div className="animate-fade-in">
              {chapter.id === "c1" ? (
                NOTES_CONTENT.map((block, i) => {
                  if (block.type === "heading") return (
                    <h1 key={i} className="text-3xl font-bold text-accent mb-6">{block.text}</h1>
                  );
                  if (block.type === "section") return (
                    <div key={i} className="mb-6">
                      <h2 className="text-lg font-semibold text-ink mb-2">{block.number}. {block.title}</h2>
                      {block.content && <p className="text-sm text-ink-secondary leading-relaxed">{block.content}</p>}
                      {block.bullets && (
                        <ul className="mt-2 space-y-1">
                          {block.bullets.map((b, j) => (
                            <li key={j} className="text-sm text-ink-secondary flex gap-2">
                              <span className="text-accent mt-1">•</span>
                              <span><strong className="text-ink">{b.bold}</strong>{b.rest}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {block.formulas && (
                        <div className="flex flex-wrap gap-3 mt-3">
                          {block.formulas.map((f, j) => (
                            <div key={j} className="formula-card flex-1 min-w-[160px] text-center">
                              <p className="text-lg font-semibold">{f.formula}</p>
                              <p className="text-xs text-accent/70 mt-1 not-italic" style={{ fontStyle: "normal", fontFamily: "Inter" }}>{f.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                  if (block.type === "key-point") return (
                    <div key={i} className="key-point mb-5 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">🔑</span>
                      <p>{block.text}</p>
                    </div>
                  );
                  if (block.type === "definition") return (
                    <div key={i} className="definition-box mb-5">
                      <p className="font-semibold mb-1">{block.title}</p>
                      <p>{block.text}</p>
                    </div>
                  );
                  return null;
                })
              ) : chapter.regions && chapter.regions.length > 0 ? (
                <div className="space-y-6">
                  {chapter.photoUrl && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-paper-border shadow-sm bg-white">
                      <div className="bg-paper-warm px-4 py-2.5 border-b border-paper-border flex justify-between items-center bg-paper-warm/50">
                        <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider flex items-center gap-1.5">
                          <span>🖼️</span> Original Note Scan
                        </span>
                        <a
                          href={chapter.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
                        >
                          View full image
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <div className="p-4 flex justify-center bg-paper-warm/20">
                        <img
                          src={chapter.photoUrl}
                          alt={chapter.name}
                          className="max-h-80 object-contain rounded-xl shadow-md border border-paper-border hover:scale-[1.01] transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-b border-paper-border pb-4 mb-4">
                    <h1 className="text-3xl font-extrabold text-ink mb-1">{chapter.name || "Study Notes"}</h1>
                    <p className="text-xs text-ink-tertiary">
                      ✨ AI Transcribed study notes from your uploaded image
                    </p>
                  </div>

                  <div className="space-y-4">
                    {chapter.regions.map((region, i) => {
                      if (region.region_type === "equation") {
                        return (
                          <div key={region.id || i} className="formula-card p-5 my-4 text-center bg-accent/5 border border-accent/20 rounded-2xl shadow-sm">
                            <p className="text-xl font-bold font-mono text-ink select-all">{region.raw_text}</p>
                            <p className="text-[11px] text-accent/70 mt-1.5 font-medium tracking-wide uppercase">{region.label || "Formula / Equation"}</p>
                          </div>
                        );
                      }
                      if (region.region_type === "definition") {
                        return (
                          <div key={region.id || i} className="definition-box my-4 p-5 border-l-4 border-accent bg-accent/5 rounded-r-2xl shadow-sm">
                            <p className="font-bold text-ink mb-1 flex items-center gap-1">
                              <span>🔑</span>
                              <span>{region.label || "Key Concept"}</span>
                            </p>
                            <p className="text-sm text-ink-secondary leading-relaxed">{region.raw_text}</p>
                          </div>
                        );
                      }
                      if (region.region_type === "list") {
                        return (
                          <div key={region.id || i} className="mb-5 bg-white p-5 rounded-2xl border border-paper-border shadow-sm">
                            <h3 className="text-sm font-bold text-ink mb-2.5 flex items-center gap-1.5">
                              <span className="text-accent">•</span>
                              <span>{region.label || "Key Points"}</span>
                            </h3>
                            <ul className="space-y-2 text-sm text-ink-secondary list-none pl-1">
                              {region.raw_text.split('\n').filter(line => line.trim()).map((line, idx) => (
                                <li key={idx} className="flex gap-2 items-start leading-relaxed">
                                  <span className="text-accent font-semibold mt-0.5">•</span>
                                  <span>{line.replace(/^-\s*/, '').replace(/^\*\s*/, '')}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      if (region.region_type === "diagram") {
                        return (
                          <div key={region.id || i} className="my-4 p-5 border border-paper-border bg-paper-warm/40 rounded-2xl shadow-sm">
                            <p className="font-semibold text-purple-700 text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
                              <span>📊</span> Diagram Description: {region.label}
                            </p>
                            <p className="text-sm text-ink-secondary leading-relaxed italic">{region.raw_text}</p>
                          </div>
                        );
                      }
                      return (
                        <div key={region.id || i} className="mb-5">
                          {region.label && <h3 className="text-sm font-bold text-ink mb-1.5">{region.label}</h3>}
                          <p className="text-sm text-ink-secondary leading-relaxed">{region.raw_text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="border-b border-paper-border pb-4">
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => handleUpdateNoteTitle(e.target.value)}
                      placeholder="Untitled Note"
                      className="text-3xl font-extrabold text-ink bg-transparent outline-none w-full border-none focus:ring-0 p-0"
                    />
                    <p className="text-xs text-ink-tertiary mt-1">
                      ✏️ Write your study notes below or scan a notebook photo
                    </p>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => handleUpdateNoteText(e.target.value)}
                    placeholder="Start typing your study notes here..."
                    className="flex-1 w-full min-h-[350px] resize-none bg-transparent text-sm text-ink leading-relaxed outline-none border-none focus:ring-0 p-0"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Assistant panel */}
        <div className="w-80 flex flex-col bg-white border-l border-paper-border">
          {/* Header */}
          <div className="px-4 py-3 border-b border-paper-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-ink">AI Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600">Online</span>
                </div>
              </div>
              <button className="text-xs text-ink-tertiary hover:text-ink">Clear</button>
            </div>
            <p className="text-xs text-ink-tertiary mt-2">Ask me anything about your notes.</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiMessages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {msg.role === "user" ? (
                  <div className="bg-accent text-white text-sm px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%]">
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-[95%]">
                    <div className="bg-paper-warm text-sm text-ink px-3 py-2.5 rounded-2xl rounded-tl-sm border border-paper-border">
                      {msg.text}
                    </div>
                    {msg.context && (
                      <div className="flex items-center gap-1 mt-1.5 px-1">
                        <svg className="w-3 h-3 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <button className="text-xs text-accent hover:underline">{msg.context}</button>
                      </div>
                    )}
                    {msg.suggestions && (
                      <div className="mt-2 space-y-1">
                        {msg.suggestions.map((s, j) => (
                          <button
                            key={j}
                            onClick={() => setAiInput(s)}
                            className="block w-full text-left text-xs text-accent border border-accent/30 bg-accent/5 px-2.5 py-1.5 rounded-lg hover:bg-accent/10 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {aiLoading && (
              <div className="flex gap-2 items-center">
                <div className="bg-paper-warm border border-paper-border px-3 py-2 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(d => (
                      <div key={d} className="w-1.5 h-1.5 rounded-full bg-ink-tertiary animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-paper-border">
            <div className="flex items-center gap-2 border border-paper-border rounded-xl px-3 py-2 bg-paper-warm focus-within:border-accent focus-within:bg-white transition-colors">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendAiMessage()}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-sm text-ink placeholder-ink-tertiary outline-none"
              />
              <button
                onClick={sendAiMessage}
                disabled={!aiInput.trim()}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40 hover:bg-accent-hover transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Workspace tab bar shared across Notes/Flashcards/Quizzes
function WorkspaceTabs({ tab, setTab, bc, chapter, cardCount }) {
  const { navigate } = useNav();

  return (
    <div className="px-6 py-3 border-b border-paper-border bg-white flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Breadcrumb items={bc} />
        <div className="w-px h-4 bg-paper-border" />
        <div className="flex items-center gap-1 text-sm">
          {[
            { key: "notes", label: "Notes" },
            { key: "flashcards", label: "Flashcards" },
            { key: "quizzes", label: "Quizzes" },
          ].map(t => (
            <button
              key={t.key}
              id={`workspace-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                tab === t.key
                  ? "bg-ink text-white"
                  : "text-ink-secondary hover:bg-paper-warm"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {tab === "flashcards" && (
          <span className="text-xs text-ink-tertiary font-medium">
            {cardCount || 0} cards
          </span>
        )}
        <button
          id="workspace-upload-btn"
          onClick={() => navigate("capture-image")}
          className="flex items-center gap-1.5 text-sm font-medium text-ink border border-paper-border px-3 py-1.5 rounded-xl hover:bg-paper-warm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload
        </button>
        <button
          onClick={() => navigate("canvas")}
          title="Back to Canvas"
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-paper-warm text-ink-secondary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
