'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const steps = [
  {
    id: 'identity',
    title: 'Identity',
    description: 'Name, plane, and faction'
  },
  {
    id: 'kinship',
    title: 'Kinship',
    description: 'Your lineage and culture'
  },
  {
    id: 'calling',
    title: 'Calling',
    description: 'Class and archetype focus'
  },
  {
    id: 'colors',
    title: 'Color Identity',
    description: 'Choose your mana signature'
  },
  {
    id: 'portrait',
    title: 'Portrait',
    description: 'Artwork and final review'
  }
];

type LorePlane = { id: string; code: string; name: string };
type LoreFaction = {
  id: string;
  planeId: string;
  code: string;
  name: string;
  colorIdentity: string;
  allowedKinships: string[];
};
type LoreKinship = { id: string; creatureType: string; planeCodes: string[] };
type LoreClass = {
  id: string;
  code: string;
  name: string;
  description: string;
  allowedArchetypeCodes: string[];
};
type LoreArchetype = { id: string; code: string; name: string; description: string };

const colorPips = ['W', 'U', 'B', 'R', 'G'];
const emptyStringArray: string[] = [];

export default function CharacterWizardPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [planes, setPlanes] = useState<LorePlane[]>([]);
  const [factions, setFactions] = useState<LoreFaction[]>([]);
  const [kinships, setKinships] = useState<LoreKinship[]>([]);
  const [classes, setClasses] = useState<LoreClass[]>([]);
  const [archetypes, setArchetypes] = useState<LoreArchetype[]>([]);
  const [planeId, setPlaneId] = useState('');
  const [factionId, setFactionId] = useState('');
  const [kinshipId, setKinshipId] = useState('');
  const [classId, setClassId] = useState('');
  const [archetypeId, setArchetypeId] = useState('');
  const [colors, setColors] = useState<string[]>(['W', 'B']);
  const [portraitUrl, setPortraitUrl] = useState('');
  const [token, setToken] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const activeStep = steps[stepIndex];
  const completion = useMemo(
    () => Math.round(((stepIndex + 1) / steps.length) * 100),
    [stepIndex]
  );

  const summary = [
    { label: 'Name', value: name || 'Unnamed' },
    { label: 'Plane', value: planes.find((p) => p.id === planeId)?.name ?? 'Unselected' },
    { label: 'Faction', value: factions.find((f) => f.id === factionId)?.name ?? 'Unselected' },
    {
      label: 'Kinship',
      value: kinships.find((k) => k.id === kinshipId)?.creatureType ?? 'Unselected'
    },
    { label: 'Class', value: classes.find((c) => c.id === classId)?.name ?? 'Unselected' },
    {
      label: 'Archetype',
      value: archetypes.find((a) => a.id === archetypeId)?.name ?? 'Unselected'
    },
    { label: 'Colors', value: colors.join('') || 'None' }
  ];

  const selectedFaction = factions.find((f) => f.id === factionId);
  const allowedKinships = useMemo(
    () => selectedFaction?.allowedKinships ?? emptyStringArray,
    [selectedFaction]
  );
  const visibleKinships = useMemo(() => {
    if (!allowedKinships.length) return kinships;
    return kinships.filter((kinship) => allowedKinships.includes(kinship.creatureType));
  }, [allowedKinships, kinships]);

  const selectedClass = classes.find((item) => item.id === classId);
  const allowedArchetypeCodes = useMemo(
    () => selectedClass?.allowedArchetypeCodes ?? emptyStringArray,
    [selectedClass]
  );
  const visibleArchetypes = useMemo(() => {
    if (!allowedArchetypeCodes.length) return archetypes;
    return archetypes.filter((archetype) => allowedArchetypeCodes.includes(archetype.code));
  }, [allowedArchetypeCodes, archetypes]);
  const selectedArchetype = archetypes.find((item) => item.id === archetypeId);

  const identityValid = name.trim().length >= 2 && planeId && factionId;
  const kinshipValid =
    kinshipId &&
    (!allowedKinships.length ||
      allowedKinships.includes(
        kinships.find((kinship) => kinship.id === kinshipId)?.creatureType ?? ''
      ));
  const callingValid =
    classId &&
    archetypeId &&
    (!allowedArchetypeCodes.length ||
      allowedArchetypeCodes.includes(
        archetypes.find((archetype) => archetype.id === archetypeId)?.code ?? ''
      ));
  const colorsValid = colors.length > 0;
  const canSubmit =
    identityValid &&
    kinshipValid &&
    callingValid &&
    colorsValid &&
    authReady &&
    token;
  const portraitValid = canSubmit;
  const stepValid = [identityValid, kinshipValid, callingValid, colorsValid, portraitValid];
  const nextDisabled = !stepValid[stepIndex] || loading || Boolean(error) || Boolean(authError);

  useEffect(() => {
    let isActive = true;

    async function loadBaseLore() {
      setLoading(true);
      setError('');
      try {
        const [planesRes, classesRes, archetypesRes] = await Promise.all([
          fetch('/api/lore/planes'),
          fetch('/api/lore/classes'),
          fetch('/api/lore/archetypes')
        ]);

        if (!planesRes.ok || !classesRes.ok || !archetypesRes.ok) {
          throw new Error('Unable to load lore data');
        }

        const planesJson = (await planesRes.json()) as { items: LorePlane[] };
        const classesJson = (await classesRes.json()) as { items: LoreClass[] };
        const archetypesJson = (await archetypesRes.json()) as { items: LoreArchetype[] };

        if (!isActive) return;

        setPlanes(planesJson.items);
        setClasses(classesJson.items);
        setArchetypes(archetypesJson.items);
        setPlaneId(planesJson.items[0]?.id ?? '');
        setClassId(classesJson.items[0]?.id ?? '');
        setArchetypeId(archetypesJson.items[0]?.id ?? '');
      } catch (err) {
        if (!isActive) return;
        setError('Unable to load lore data.');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadBaseLore();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    // Check for stored JWT token
    const storedToken = window.localStorage.getItem('cc_auth_token');
    
    if (!storedToken) {
      if (!isActive) return;
      setShowLoginForm(true);
      setAuthReady(false);
      setLoading(false);
      return;
    }

    // Verify token by calling /api/auth/me
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (!res.ok) {
          // Token invalid, clear it
          window.localStorage.removeItem('cc_auth_token');
          if (!isActive) return;
          setShowLoginForm(true);
          setAuthReady(false);
          setLoading(false);
          return;
        }

        if (!isActive) return;
        setToken(storedToken);
        setAuthReady(true);
        setAuthError('');
        setLoading(false);
      } catch (err) {
        if (!isActive) return;
        setShowLoginForm(true);
        setAuthReady(false);
        setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPlaneLore() {
      if (!planeId) return;
      const planeCode = planes.find((p) => p.id === planeId)?.code;
      if (!planeCode) return;

      try {
        const [factionsRes, kinshipsRes] = await Promise.all([
          fetch(`/api/lore/factions?planeCode=${planeCode}`),
          fetch(`/api/lore/kinships?planeCode=${planeCode}`)
        ]);

        if (!factionsRes.ok || !kinshipsRes.ok) {
          throw new Error('Unable to load plane lore');
        }

        const factionsJson = (await factionsRes.json()) as { items: LoreFaction[] };
        const kinshipsJson = (await kinshipsRes.json()) as { items: LoreKinship[] };

        if (!isActive) return;

        setFactions(factionsJson.items);
        setKinships(kinshipsJson.items);
        setFactionId(factionsJson.items[0]?.id ?? '');
        setKinshipId(kinshipsJson.items[0]?.id ?? '');
      } catch (err) {
        if (!isActive) return;
        setError('Unable to load plane-specific lore.');
      }
    }

    loadPlaneLore();

    return () => {
      isActive = false;
    };
  }, [planeId, planes]);

  useEffect(() => {
    if (!kinships.length) return;
    if (!allowedKinships.length) return;
    const allowed = kinships.find((kinship) => allowedKinships.includes(kinship.creatureType));
    if (!allowed) return;
    if (!allowedKinships.includes(kinships.find((k) => k.id === kinshipId)?.creatureType ?? '')) {
      setKinshipId(allowed.id);
    }
  }, [allowedKinships, kinshipId, kinships]);

  useEffect(() => {
    if (!archetypes.length) return;
    if (!allowedArchetypeCodes.length) return;
    const allowed = archetypes.find((item) => allowedArchetypeCodes.includes(item.code));
    if (!allowed) return;
    if (!allowedArchetypeCodes.includes(archetypes.find((a) => a.id === archetypeId)?.code ?? '')) {
      setArchetypeId(allowed.id);
    }
  }, [allowedArchetypeCodes, archetypeId, archetypes]);

  function toggleColor(color: string) {
    setColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }

  async function handleCreate() {
    if (!canSubmit || isSubmitting) return;
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          planeId,
          factionId,
          kinshipId,
          classId,
          archetypeId,
          chosenColorIdentity: colors.join(''),
          portraitUrl: portraitUrl.trim() || null
        })
      });

      if (!res.ok) {
        throw new Error('Create failed');
      }

      const created = (await res.json()) as { id: string };
      router.push(`/app/characters/${created.id}`);
    } catch (err) {
      setSubmitError('Unable to create character.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin() {
    if (isLoggingIn || !loginEmail || !loginPassword) return;
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      if (!res.ok) {
        const data = (await res.json()) as any;
        throw new Error(data.error || 'Login failed');
      }

      const data = (await res.json()) as { token: string };
      window.localStorage.setItem('cc_auth_token', data.token);
      setToken(data.token);
      setAuthReady(true);
      setShowLoginForm(false);
      setLoginEmail('');
      setLoginPassword('');
      setLoading(false);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="page wizard-shell">
      {showLoginForm && (
        <div className="wizard-header">
          <div>
            <p className="eyebrow">Authentication</p>
            <h1>Sign In</h1>
            <p className="lead">Log in to your character vault.</p>
            {authError && <p className="wizard-alert">{authError}</p>}
          </div>
        </div>
      )}

      {showLoginForm ? (
        <div className="wizard-grid">
          <section className="sheet-card" style={{ marginTop: '2rem' }}>
            <h2>Login</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoggingIn}
                />
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoggingIn}
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn || !loginEmail || !loginPassword}
                style={{ marginTop: '1rem' }}
              >
                {isLoggingIn ? 'Logging in...' : 'Sign In'}
              </button>
              <p style={{ fontSize: '0.875rem', color: '#888' }}>
                Demo: Use any email and password to get started.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <>
      <div className="wizard-header">
        <div>
          <p className="eyebrow">Character Creation</p>
          <h1>Forge a Commander</h1>
          <p className="lead">
            Build a lore-true identity in five focused steps. Your choices shape
            deck limits, level-up options, and story hooks.
          </p>
          {error ? <p className="wizard-alert">{error}</p> : null}
          {authError ? <p className="wizard-alert">{authError}</p> : null}
        </div>
        <div className="wizard-progress">
          <div className="progress-label">Progress</div>
          <div className="progress-bar">
            <span style={{ width: `${completion}%` }} />
          </div>
          <div className="progress-value">{completion}%</div>
        </div>
      </div>

      <div className="wizard-grid">
        <section className="wizard-card">
          <div className="wizard-stepper">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                className={`step-chip ${index === stepIndex ? 'active' : ''}`}
                onClick={() => setStepIndex(index)}
              >
                <span className="step-title">{step.title}</span>
                <span className="step-desc">{step.description}</span>
              </button>
            ))}
          </div>

          <div className="wizard-stage">
            <h2>{activeStep.title}</h2>
            <p className="stage-note">{activeStep.description}</p>

            {activeStep.id === 'identity' && (
              <div className="wizard-fields">
                <label className="wizard-field">
                  <span>Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Aurelia Nightveil"
                    disabled={loading}
                  />
                </label>
                <label className="wizard-field">
                  <span>Plane</span>
                  <select
                    value={planeId}
                    onChange={(event) => setPlaneId(event.target.value)}
                    disabled={loading || planes.length === 0}
                  >
                    {planes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wizard-field">
                  <span>Faction</span>
                  <select
                    value={factionId}
                    onChange={(event) => setFactionId(event.target.value)}
                    disabled={loading || factions.length === 0}
                  >
                    {factions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {activeStep.id === 'kinship' && (
              <div className="wizard-fields">
                <label className="wizard-field">
                  <span>Kinship</span>
                  <select
                    value={kinshipId}
                    onChange={(event) => setKinshipId(event.target.value)}
                    disabled={loading || kinships.length === 0}
                  >
                    {visibleKinships.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.creatureType}
                      </option>
                    ))}
                  </select>
                </label>
                {allowedKinships.length > 0 && !kinshipValid ? (
                  <div className="wizard-callout">
                    This faction only allows: {allowedKinships.join(', ')}.
                  </div>
                ) : null}
                <label className="wizard-field">
                  <span>Bloodline Vow</span>
                  <textarea placeholder="A short oath or cultural trait." rows={4} />
                </label>
              </div>
            )}

            {activeStep.id === 'calling' && (
              <div className="wizard-fields">
                <label className="wizard-field">
                  <span>Class</span>
                  <select
                    value={classId}
                    onChange={(event) => setClassId(event.target.value)}
                    disabled={loading || classes.length === 0}
                  >
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wizard-field">
                  <span>Archetype</span>
                  <select
                    value={archetypeId}
                    onChange={(event) => setArchetypeId(event.target.value)}
                    disabled={loading || visibleArchetypes.length === 0}
                  >
                    {visibleArchetypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {visibleArchetypes.length === 0 ? (
                  <div className="wizard-callout">No archetypes available for this class.</div>
                ) : null}
                <div className="wizard-callout">
                  Your archetype will shape the talent packages you roll during level-ups.
                </div>
              </div>
            )}

            {activeStep.id === 'colors' && (
              <div className="wizard-fields">
                <div className="wizard-field">
                  <span>Choose color identity</span>
                  <div className="color-grid">
                    {colorPips.map((pip) => (
                      <button
                        key={pip}
                        type="button"
                        className={`color-chip ${colors.includes(pip) ? 'active' : ''}`}
                        onClick={() => toggleColor(pip)}
                      >
                        {pip}
                      </button>
                    ))}
                  </div>
                  <p className="helper">Selected: {colors.join('') || 'None'}</p>
                </div>
              </div>
            )}

            {activeStep.id === 'portrait' && (
              <div className="wizard-fields">
                <label className="wizard-field">
                  <span>Portrait URL</span>
                  <input
                    value={portraitUrl}
                    onChange={(event) => setPortraitUrl(event.target.value)}
                    placeholder="https://"
                  />
                </label>
                <div className="wizard-callout">
                  Final review: submit when your summary feels right. You can update artwork later.
                </div>
              </div>
            )}

            <div className="wizard-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={stepIndex === 0}
              >
                Back
              </button>
              {stepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((prev) => prev + 1)}
                  disabled={nextDisabled}
                >
                  Next step
                </button>
              ) : (
                <button type="button" onClick={handleCreate} disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Character'}
                </button>
              )}
            </div>
            {!stepValid[stepIndex] ? (
              <p className="wizard-hint">Complete this step to continue.</p>
            ) : null}
            {submitError ? <p className="wizard-alert">{submitError}</p> : null}
          </div>
        </section>

        <aside className="wizard-summary">
          <div className="summary-card">
            <h3>Sheet Preview</h3>
            <p className="summary-lead">Live snapshot of your selections.</p>
            <dl>
              {summary.map((row) => (
                <div key={row.label} className="summary-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              <div className="summary-row">
                <dt>Portrait</dt>
                <dd>{portraitUrl ? 'Ready' : 'Not set'}</dd>
              </div>
            </dl>
          </div>
          {activeStep.id === 'calling' ? (
            <div className="wizard-lore-panel">
              <div>
                <span className="panel-label">Class</span>
                <strong>{selectedClass?.name ?? 'Unselected'}</strong>
                <p>{selectedClass?.description ?? 'Choose a class to see its focus.'}</p>
                {allowedArchetypeCodes.length > 0 ? (
                  <p className="panel-meta">Allowed archetypes: {allowedArchetypeCodes.join(', ')}</p>
                ) : null}
              </div>
              <div>
                <span className="panel-label">Archetype</span>
                <strong>{selectedArchetype?.name ?? 'Unselected'}</strong>
                <p>
                  {selectedArchetype?.description ??
                    'Pick an archetype to see how it shapes your progression.'}
                </p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
        </>
      )}
    </div>
  );
}
