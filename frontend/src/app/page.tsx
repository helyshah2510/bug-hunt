
"use client";

import { useState } from "react";

type Scene = "intro" | "transition" | "menu";

export default function Home() {
  const [scene, setScene] = useState<Scene>("intro");

  function advanceScene() {
    if (scene !== "intro") return;

    setScene("transition");

    window.setTimeout(() => {
      setScene("menu");
    }, 850);
  }

  return (
    <main
      className={`detective-room scene-${scene}`}
      onClick={advanceScene}
    >
      <div className="room-overlay" />

      <div className="dust-layer" aria-hidden="true">
        {Array.from({ length: 500 }, (_, i) => (
          <span
            key={i}
            className="dust-particle"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i % 6) * -1.3}s`,
              animationDuration: `${7 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      {scene !== "menu" && (
        <section
          className="case-file"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="paperclip" />

          <header className="file-header">
            <span className="detective-icon">♧</span>
            <h1>BUG HUNT</h1>
            <p>CASE FILE #001</p>
          </header>

          <div className="file-content">
            <p className="file-eyebrow">Your Next Mission</p>

            <h2>
              A new case
              <br />
              awaits, Detective.
            </h2>

            <div className="red-underline" />

            <span className="classified">TOP SECRET</span>

            <div className="mission">
              <h3>MISSION BRIEF</h3>
              <p>
                Investigate broken Python programs,
                find the bugs, and prove your skills
                one case at a time.
              </p>
            </div>
          </div>

          <div className="file-footer">
            <span>CONFIDENTIAL</span>
            <span>EST. 2026</span>
          </div>
        </section>
      )}

      {scene === "menu" && (
        <section
          className="main-menu"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="menu-eyebrow">
            CASE FILE #001 • CLEARED FOR ACCESS
          </p>

          <h1>Welcome, Detective.</h1>
          <p>Your next mystery is waiting to be solved.</p>

          <nav className="menu-buttons">
            <a href="/login" className="menu-button primary">
              Start Investigating <span>→</span>
            </a>

            <a href="/register" className="menu-button secondary">
              Join the Investigation
            </a>
          </nav>
        </section>
      )}

      <div className="room-caption">
        <span className="status-dot" />
        DETECTIVE HEADQUARTERS
      </div>
    </main>
  );
}