import { randomUUID } from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CharacterSheetSchema } from '@cc/shared';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const maybeDescribe = hasDatabase ? describe : describe.skip;

maybeDescribe('GET /api/characters/:id', () => {
  let app: ReturnType<(typeof import('../src/app.js'))['createApp']>;
  let pool: import('pg').Pool;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const appModule = await import('../src/app.js');
    const dbModule = await import('../src/db.js');
    app = appModule.createApp();
    pool = dbModule.pool;
    const suffix = randomUUID().slice(0, 8);
    const planeCode = `TS${suffix}`;
    const factionCode = `FA${suffix}`;
    const kinshipType = `TestKinship${suffix}`;
    const classCode = `TEST_CLASS_${suffix}`;
    const archetypeCode = `TEST_ARCH_${suffix}`;

    const rulesetRes = await pool.query(
      'insert into rulesets(version, notes) values ($1, $2) returning id',
      [`test-contract-${suffix}`, 'contract test']
    );
    ids.rulesetId = rulesetRes.rows[0].id as string;

    const planeRes = await pool.query(
      'insert into lore_planes(code, name, era_tags, is_active) values ($1, $2, $3, $4) returning id',
      [planeCode, 'Test Plane', [], true]
    );
    ids.planeId = planeRes.rows[0].id as string;

    const factionRes = await pool.query(
      'insert into lore_factions(plane_id, code, name, color_identity, allowed_kinships, is_active) values ($1, $2, $3, $4, $5, $6) returning id',
      [ids.planeId, factionCode, 'Test Faction', 'WB', [kinshipType], true]
    );
    ids.factionId = factionRes.rows[0].id as string;

    const kinshipRes = await pool.query(
      'insert into lore_kinships(creature_type, plane_codes, is_active) values ($1, $2, $3) returning id',
      [kinshipType, [planeCode], true]
    );
    ids.kinshipId = kinshipRes.rows[0].id as string;

    const classRes = await pool.query(
      'insert into lore_classes(code, name, description, allowed_archetypes, is_active) values ($1, $2, $3, $4, $5) returning id',
      [classCode, 'Test Class', 'Contract test class', [archetypeCode], true]
    );
    ids.classId = classRes.rows[0].id as string;

    const archetypeRes = await pool.query(
      'insert into lore_archetypes(code, name, description, required_tags, banned_tags, is_active) values ($1, $2, $3, $4, $5, $6) returning id',
      [archetypeCode, 'Test Archetype', 'Contract test archetype', '[]', '[]', true]
    );
    ids.archetypeId = archetypeRes.rows[0].id as string;

    const userRes = await pool.query(
      'insert into users(email, handle, password_hash) values ($1, $2, $3) returning id',
      [`test.contract.${suffix}@local`, `test-contract-${suffix}`, 'test-hash']
    );
    ids.userId = userRes.rows[0].id as string;

    const characterRes = await pool.query(
      'insert into characters(user_id, name, plane_id, faction_id, kinship_id, class_id, archetype_id, color_identity, level, xp_total, bracket_cap, portrait_url, card_version) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id',
      [
        ids.userId,
        'Contract Test Character',
        ids.planeId,
        ids.factionId,
        ids.kinshipId,
        ids.classId,
        ids.archetypeId,
        'WB',
        1,
        0,
        1,
        null,
        1
      ]
    );
    ids.characterId = characterRes.rows[0].id as string;
  });

  afterAll(async () => {
    if (!ids.characterId || !pool) return;
    await pool.query('delete from characters where id = $1', [ids.characterId]);
    await pool.query('delete from users where id = $1', [ids.userId]);
    await pool.query('delete from lore_factions where id = $1', [ids.factionId]);
    await pool.query('delete from lore_planes where id = $1', [ids.planeId]);
    await pool.query('delete from lore_kinships where id = $1', [ids.kinshipId]);
    await pool.query('delete from lore_classes where id = $1', [ids.classId]);
    await pool.query('delete from lore_archetypes where id = $1', [ids.archetypeId]);
    await pool.query('delete from rulesets where id = $1', [ids.rulesetId]);
  });

  it('returns a payload matching CharacterSheetSchema', async () => {
    const res = await request(app)
      .get(`/api/characters/${ids.characterId}`)
      .expect(200);

    expect(() => CharacterSheetSchema.parse(res.body)).not.toThrow();
  });
});
