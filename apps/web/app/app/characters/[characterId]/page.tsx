'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type CharacterSheet = {
  character: {
    id: string;
    userId: string;
    name: string;
    planeId: string;
    factionId: string;
    kinshipId: string;
    classId: string;
    archetypeId: string;
    colorIdentity: string;
    level: number;
    xpTotal: number;
    bracketCap: number;
    portraitUrl?: string | null;
    cardVersion: number;
  };
  lore: {
    plane: { id: string; code: string; name: string };
    faction: { id: string; code: string; name: string };
    kinship: { id: string; creatureType: string };
    class: { id: string; code: string; name: string };
    archetype: { id: string; code: string; name: string };
  };
  unlocks: Array<{
    id: string;
    level: number;
    roll: number;
    talentPackageId: string;
    createdAt: string;
  }>;
  recentXpEvents: Array<{
    id: string;
    type: string;
    value: number;
    evidenceRef?: string | null;
    createdAt: string;
  }>;
  xp: {
    total: number;
    nextLevelAt: number;
    eligibleToLevelUp: boolean;
    remainingToNext: number;
  };
  gating: {
    bracketCap: number;
    deckBracketMaxAllowed: number;
    notes: string[];
  };
  ruleset: {
    id: string;
    version: string;
    notes: string;
  };
};

export default function CharacterDetailPage() {
  const params = useParams();
  const characterId = params?.characterId as string | undefined;
  const [data, setData] = useState<CharacterSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadCharacter() {
      if (!characterId) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/characters/${characterId}`);
        if (!res.ok) throw new Error('Failed to load');
        const payload = (await res.json()) as CharacterSheet;
        if (!isActive) return;
        setData(payload);
      } catch (err) {
        if (!isActive) return;
        setError('Unable to load character sheet.');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadCharacter();

    return () => {
      isActive = false;
    };
  }, [characterId]);

  const colorPips = useMemo(() => data?.character.colorIdentity.split('') ?? [], [data]);

  if (loading) {
    return (
      <div className="page">
        <h1>Character Sheet</h1>
        <p>Loading sheet...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page">
        <h1>Character Sheet</h1>
        <p className="wizard-alert">{error || 'Character not found.'}</p>
      </div>
    );
  }

  const { character, lore, xp, gating, ruleset, unlocks, recentXpEvents } = data;

  return (
    <div className="page sheet-shell">
      <section className="sheet-hero">
        <div>
          <p className="eyebrow">Commander Sheet</p>
          <h1>{character.name}</h1>
          <p className="sheet-subtitle">Level {character.level} · Bracket {character.bracketCap}</p>
          <div className="sheet-actions">
            <Link className="ghost-link" href={`/app/characters/${character.id}/card`}>
              View Card
            </Link>
            <Link className="ghost-link" href={`/app/characters/${character.id}/level-up`}>
              Level Up
            </Link>
          </div>
        </div>
        <div className="sheet-badge">
          <div className="badge-label">Color Identity</div>
          <div className="badge-pips">
            {colorPips.length ? colorPips.map((pip) => <span key={pip}>{pip}</span>) : <span>None</span>}
          </div>
        </div>
      </section>

      <div className="sheet-grid">
        <section className="sheet-card">
          <h2>Profile</h2>
          <div className="sheet-kv">
            <div>
              <span>Plane</span>
              <strong>{lore.plane.name}</strong>
            </div>
            <div>
              <span>Faction</span>
              <strong>{lore.faction.name}</strong>
            </div>
            <div>
              <span>Kinship</span>
              <strong>{lore.kinship.creatureType}</strong>
            </div>
            <div>
              <span>Class</span>
              <strong>{lore.class.name}</strong>
            </div>
            <div>
              <span>Archetype</span>
              <strong>{lore.archetype.name}</strong>
            </div>
            <div>
              <span>Card Version</span>
              <strong>{character.cardVersion}</strong>
            </div>
          </div>
        </section>

        <section className="sheet-card">
          <h2>XP & Leveling</h2>
          <div className="sheet-xp">
            <div>
              <span>Total XP</span>
              <strong>{xp.total}</strong>
            </div>
            <div>
              <span>Next Level At</span>
              <strong>{xp.nextLevelAt}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{xp.remainingToNext}</strong>
            </div>
            <div>
              <span>Eligible</span>
              <strong>{xp.eligibleToLevelUp ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        </section>

        <section className="sheet-card">
          <h2>Gating Notes</h2>
          <ul className="sheet-list">
            {gating.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        <section className="sheet-card">
          <h2>Recent XP</h2>
          {recentXpEvents.length === 0 ? (
            <p className="sheet-empty">No XP recorded yet.</p>
          ) : (
            <div className="sheet-events">
              {recentXpEvents.map((event) => (
                <div key={event.id} className="sheet-event">
                  <div>
                    <strong>{event.type}</strong>
                    <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="sheet-event-value">+{event.value}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="sheet-card">
          <h2>Unlock History</h2>
          {unlocks.length === 0 ? (
            <p className="sheet-empty">No unlocks yet.</p>
          ) : (
            <div className="sheet-events">
              {unlocks.map((unlock) => (
                <div key={unlock.id} className="sheet-event">
                  <div>
                    <strong>Level {unlock.level}</strong>
                    <span>Roll {unlock.roll}</span>
                  </div>
                  <div className="sheet-event-value">{unlock.talentPackageId}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="sheet-card sheet-ruleset">
          <h2>Ruleset</h2>
          <p className="sheet-subtitle">{ruleset.version}</p>
          <p>{ruleset.notes || 'Seeded ruleset.'}</p>
        </section>
      </div>
    </div>
  );
}
