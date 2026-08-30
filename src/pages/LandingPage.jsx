import { useNav } from "../context/NavContext";

export default function LandingPage() {
  const { navigate } = useNav();

  return (
    <div className="min-h-screen bg-paper font-sans overflow-x-hidden">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-paper-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 4H8a2 2 0 00-2 2v14l6-3 6 3V6a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <span className="text-base font-bold text-ink">StudySnap</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-secondary">
            {["Features", "How it works", "Use cases", "Pricing", "About"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="hover:text-ink transition-colors">{item}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              id="landing-login-btn"
              onClick={() => navigate("login")}
              className="px-4 py-1.5 text-sm font-medium text-ink border border-paper-border rounded-xl hover:bg-paper-warm transition-colors"
            >
              Log in
            </button>
            <button
              id="landing-signup-btn"
              onClick={() => navigate("signup")}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-ink rounded-xl hover:bg-ink/80 transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <h1 className="text-6xl font-bold text-ink leading-[1.08] tracking-tight mb-6">
              Your notes.<br />
              Understood.<br />
              <span className="text-accent">Forever.</span>
            </h1>
            <p className="text-base text-ink-secondary leading-relaxed mb-8 max-w-sm">
              Snap handwritten notes, turn them into smart flashcards, get explanations grounded in your own notes — not generic answers.
            </p>
            <div className="flex items-center gap-3 mb-10">
              <button
                id="landing-cta-primary"
                onClick={() => navigate("canvas")}
                className="flex items-center gap-2 bg-ink text-white px-6 py-3.5 rounded-2xl text-sm font-semibold hover:bg-ink/80 transition-colors shadow-sm"
              >
                Get started for free →
              </button>
              <button
                id="landing-cta-secondary"
                onClick={() => navigate("canvas")}
                className="px-6 py-3.5 border-2 border-paper-border text-sm font-medium text-ink-secondary rounded-2xl hover:border-ink-tertiary hover:text-ink transition-colors"
              >
                Explore demo
              </button>
            </div>
            <p className="text-xs text-ink-tertiary flex items-center gap-1.5">
              <span className="text-accent">✦</span>
              Loved by students at 1000+ schools &amp; colleges
            </p>
          </div>

          {/* Right: Visual */}
          <div className="relative h-[480px]">
            {/* Notebook background */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-card border border-paper-border overflow-hidden">
              <div className="paper-texture h-full" />
            </div>

            {/* Floating sticky note */}
            <div
              className="absolute top-4 right-4 w-44 bg-note-yellow border border-note-yellow-dark rounded-sm shadow-note p-4 animate-float"
              style={{ transform: "rotate(3deg)", fontFamily: "'Caveat', cursive" }}
            >
              <p className="font-bold text-base text-ink mb-1">Key Points</p>
              <ul className="text-sm text-ink/80 space-y-0.5">
                <li>• Occurs in chloroplasts</li>
                <li>• Requires sunlight</li>
                <li>• Produces glucose</li>
                <li>• Releases oxygen</li>
              </ul>
            </div>

            {/* Flashcard */}
            <div className="absolute bottom-28 left-4 w-52 bg-white rounded-2xl shadow-card border border-paper-border p-4">
              <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">DEFINITION · 1/12</span>
              <p className="text-sm font-semibold text-ink mt-2 mb-2">What is photosynthesis?</p>
              <p className="text-xs text-ink-secondary leading-relaxed">The process by which green plants and other organisms use sunlight to make their own food.</p>
              <button className="mt-3 text-xs text-accent font-medium hover:underline flex items-center gap-1">
                View in your notes →
              </button>
            </div>

            {/* AI explanation card */}
            <div className="absolute bottom-4 right-4 w-44 bg-white rounded-2xl shadow-card border border-paper-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">Explained</span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                This diagram shows how a leaf takes in carbon dioxide and water, uses sunlight, and releases oxygen while producing glucose.
              </p>
            </div>

            {/* Decorative notebook lines */}
            <div className="absolute inset-6 top-24 pointer-events-none">
              <p className="text-base font-bold text-ink mb-3" style={{ fontFamily: "'Caveat', cursive", fontSize: 22 }}>Photosynthesis</p>
              <p className="text-sm text-ink-secondary leading-relaxed" style={{ fontFamily: "'Caveat', cursive", fontSize: 15 }}>
                Process by which green plants use sunlight to synthesize foods with the help of chlorophyll.
              </p>
              <p className="text-sm font-semibold text-ink mt-3 mb-1" style={{ fontFamily: "'Caveat', cursive" }}>Equation</p>
              <p className="formula-card text-xs py-2 px-3 inline-block" style={{ fontFamily: "'Caveat', cursive", fontSize: 14 }}>
                6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-8 mt-16 pt-8 border-t border-paper-border">
          {[
            { icon: "✦", label: "Google Gemini" },
            { icon: "🔥", label: "Firebase" },
            { icon: "📱", label: "PWA Ready" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-ink-tertiary">
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="bg-paper-warm py-24 border-y border-paper-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-ink text-center mb-16">Everything you need to study smarter</h2>
          <div className="grid grid-cols-5 gap-8">
            {[
              { icon: "📱", title: "Snap & Organize", desc: "Capture notes or upload files. We'll keep everything organized for you." },
              { icon: "🧠", title: "Smart Understanding", desc: "AI reads your notes the way you wrote them — with full context." },
              { icon: "🃏", title: "Flashcards that Click", desc: "Get type-aware flashcards made from your exact notes." },
              { icon: "💬", title: "Grounded Explanations", desc: "Wrong answer? Get help using your own notes, not generic explanations." },
              { icon: "✈️", title: "Study Anywhere", desc: "Works offline. Syncs across devices. Your notes, always with you." },
            ].map((feat, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-paper-border flex items-center justify-center text-2xl mb-4 shadow-sm">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-semibold text-ink mb-2">{feat.title}</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-ink text-center mb-16">How StudySnap works</h2>
        <div className="grid grid-cols-4 gap-4 items-start">
          {[
            { num: "1", title: "Snap or upload", desc: "Capture your handwritten notes or upload files.", bg: "#FFF8E7" },
            { num: "2", title: "We understand", desc: "AI reads and structures your notes with smart context.", bg: "#F0F4FF" },
            { num: "3", title: "Get flashcards", desc: "Type-aware flashcards made just for you.", bg: "#F0FFF4" },
            { num: "4", title: "Learn & improve", desc: "Study, take quizzes, and get explanations grounded in your own notes.", bg: "#FFF0F5" },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div
                className="w-full rounded-2xl p-5 mb-4 border border-paper-border"
                style={{ background: step.bg, minHeight: 100 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-6 h-6 rounded-full bg-ink text-white text-xs flex items-center justify-center font-bold">{step.num}</div>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-ink mb-1">{step.title}</p>
                  <div className="flex gap-1">
                    <div className="h-1.5 flex-1 rounded bg-ink/10" />
                    <div className="h-1.5 flex-[0.6] rounded bg-ink/10" />
                  </div>
                  <div className="flex gap-1 mt-1">
                    <div className="h-1.5 flex-[0.8] rounded bg-ink/10" />
                    <div className="h-1.5 flex-1 rounded bg-ink/10" />
                  </div>
                </div>
              </div>
              {i < 3 && (
                <div className="flex items-center justify-center mb-4 w-full">
                  <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              <p className="text-xs font-semibold text-ink mb-1">{step.title}</p>
              <p className="text-xs text-ink-secondary leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        {/* Handwritten annotation */}
        <div className="text-center mt-8">
          <span
            className="text-3xl text-ink/40 font-bold inline-block rotate-[-3deg]"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Study smarter,<br />not harder ↗
          </span>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-paper-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-ink flex items-center justify-center">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 4H8a2 2 0 00-2 2v14l6-3 6 3V6a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-ink">StudySnap</span>
          </div>
          <p className="text-xs text-ink-tertiary">© 2026 StudySnap. Made for students.</p>
          <div className="flex gap-5 text-xs text-ink-tertiary">
            <a href="#" className="hover:text-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink transition-colors">Terms</a>
            <a href="#" className="hover:text-ink transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
