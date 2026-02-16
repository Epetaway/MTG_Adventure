import { randomUUID } from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LevelUpResultSchema } from '@cc/shared';
import { nextLevelXpThreshold } from '../src/services/progression.js';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const maybeDescribe = hasDatabase ? describe : describe.skip;

maybeDescribe('POST /api/characters/:id/level-up/roll', () => {
  let app: ReturnType<(typeof import('../src/app.js'))['createApp']>;
  let pool: import('pg').Pool;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const appModule = await import('../src/app.js');
    const dbModule = await import('../src/db.js');
    app = appModule.createApp();
    pool = dbModule.pool;

    const suffix = randomUUID().slice(0, 8);
    const planeCode = `LP${suffix}`;
    const factionCode = `LF${suffix}`;
    const kinshipType = `TestKinship${suffix}`;
    const classCode = `TEST_CLASS_${suffix}`;
    const archetypeCode = `TEST_ARCH_${suffix}`;

    const rulesetRes = await pool.query(
      'insert into rulesets(version, notes) values ($1, $2) returning id',
      [`test-levelup-${suffix}`, 'level up contract test']
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

    const talentRes = await pool.query(
      'insert into talent_packages(ruleset_id, archetype_id, level_min, level_max, bracket_min, bracket_max, name, rules_text, keywords, mana_value_delta, stats_delta, weight, is_active) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id',
      [
        ids.rulesetId,
        ids.archetypeId,
        2,
        2,
        1,
        1,
        'Test Talent',
        'Gain +1 life on upkeep.',
        ['lifegain'],
        0,
        '{}',
        1,
        true
      ]
    );
    ids.talentPackageId = talentRes.rows[0].id as string;

    const userRes = await pool.query(
      'insert into users(email, handle, password_hash) values ($1, $2, $3) returning id',
      [`test.levelup.${suffix}@local`, `test-levelup-${suffix}`, 'test-hash']
    );
    ids.userId = userRes.rows[0].id as string;

    const nextLevelAt = nextLevelXpThreshold(2);

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
        nextLevelAt,
        1,
        null,
        1
      ]
    );
    ids.characterId = characterRes.rows[0].id as string;
  });

  afterAll(async () => {
    if (!pool) return;
    if (ids.characterId) {
      await pool.query('delete from character_unlocks where character_id = $1', [
        ids.characterId
      ]);
      await pool.query('delete from characters where id = $1', [ids.characterId]);
    }
    if (ids.userId) {
      await pool.query('delete from users where id = $1', [ids.userId]);
    }
    if (ids.talentPackageId) {
      await pool.query('delete from talent_packages where id = $1', [
        ids.talentPackageId
      ]);
    }
    if (ids.archetypeId) {
      await pool.query('delete from lore_archetypes where id = $1', [
        ids.archetypeId
      ]);
    }
    if (ids.classId) {
      await pool.query('delete from lore_classes where id = $1', [ids.classId]);
    }
    if (ids.kinshipId) {
      await pool.query('delete from lore_kinships where id = $1', [ids.kinshipId]);
    }
    if (ids.factionId) {
      await pool.query('delete from lore_factions where id = $1', [ids.factionId]);
    }
    if (ids.planeId) {
      await pool.query('delete from lore_planes where id = $1', [ids.planeId]);
    }
    if (ids.rulesetId) {
      await pool.query('delete from rulesets where id = $1', [ids.rulesetId]);
    }
  });

  it('returns a payload matching LevelUpResultSchema', async () => {
    const res = await request(app)
      .post(`/api/characters/${ids.characterId}/level-up/roll`)
      .expect(200);

    expect(() => LevelUpResultSchema.parse(res.body)).not.toThrow();
    expect(res.body.newLevel).toBe(2);
  });
});
