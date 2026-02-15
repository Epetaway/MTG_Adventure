export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-card">
        <h1>Build lore-consistent commanders.</h1>
        <p>
          Create characters, validate decks, track progression, and log matches
          with bracket-gated balance.
        </p>
        <div className="hero-actions">
          <button className="primary">Create Character</button>
          <button className="ghost">View Blueprint</button>
        </div>
      </div>
      <div className="hero-grid">
        <div className="panel">
          <h2>Character Sheet</h2>
          <p>Plane, faction, kinship, class, archetype, and oath tracking.</p>
        </div>
        <div className="panel">
          <h2>Rules Engine</h2>
          <p>Validate brackets, tags, and legality with clear explanations.</p>
        </div>
        <div className="panel">
          <h2>Table Mode</h2>
          <p>Fast pod setup, counters, and match history.</p>
        </div>
      </div>
    </section>
  );
}
