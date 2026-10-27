"use client";

import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { useState } from "react";

type Scene = "intro" | "transition" | "menu";

export default function Home() {
  const router = useRouter();
  const [scene, setScene] = useState<Scene>("intro");
  const [checking, setChecking] = useState(false);

  async function handleStart() {
    if (checking) return;

    const token = localStorage.getItem("token");

    //no token at all :normal login
    if (!token) {
      router.push("/login");
      return;
    }
    setChecking(true);
    try {
      // Server decides if the token is still good
      const user = await apiFetch<{ role: "ADMIN" | "PLAYER" }>("/auth/me");
      router.push(user.role === "ADMIN" ? "/admin" : "/challenges");
    } catch {
      // Token was dead: remove it and explain why
      localStorage.removeItem("token");
      router.push("/login?expired=true");
    } finally {
      setChecking(false);
    }
  }

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
            <button onClick={handleStart} className="menu-button primary" disabled={checking}>
              {checking ? "Checking..." : "Start Investigating"} <span>→</span>
            </button>

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