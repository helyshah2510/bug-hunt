export default function Home() {
  return (
    <main className="detective-room">
      <div className="room-overlay" />
      <section className="case-file">
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
      <div className="room-caption">
        <span className="status-dot" />
        DETECTIVE HEADQUARTERS
      </div>
    </main>
  );
}