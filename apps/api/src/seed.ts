import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pool } from "./db.js";

type LoreSeed = {
  planes: Array<{ code: string; name: string; eraTags?: string[]; isActive?: boolean }>;
  factions: Array<{
    planeCode: string;
    code: string;
    name: string;
    colorIdentity: string;
    allowedKinships?: string[];
    isActive?: boolean;
  }>;
  kinships: Array<{ creatureType: string; planeCodes?: string[]; isActive?: boolean }>;
  classes: Array<{
    code: string;
    name: string;
    description: string;
    allowedArchetypeCodes?: string[];
    isActive?: boolean;
  }>;
  archetypes: Array<{
    code: string;
    name: string;
    description: string;
    requiredTags?: unknown[];
    bannedTags?: unknown[];
    isActive?: boolean;
  }>;
};

type TalentSeed = {
  rulesetVersion: string;
  packages: Array<{
    archetypeCode: string;
    levelMin: number;
    levelMax: number;
    bracketMin: number;
    bracketMax: number;
    name: string;
    rulesText: string;
    keywords?: string[];
    manaValueDelta?: number;
    statsDelta?: unknown;
    weight?: number;
  }>;
};

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function upsertRuleset(version: string) {
  const { rows } = await pool.query(
    "insert into rulesets(version, notes) values ($1, $2) on conflict (version) do update set notes = excluded.notes returning id",
    [version, "seed"]
  );
  return rows[0].id as string;
}

async function main() {
  const lorePath = path.resolve(process.cwd(), "../../packages/shared/src/seed/lore.sample.json");
  const talentPath = path.resolve(
    process.cwd(),
    "../../packages/shared/src/seed/talent_packages.sample.json"
  );

  const lore = readJson<LoreSeed>(lorePath);
  const talents = readJson<TalentSeed>(talentPath);

  const client = await pool.connect();
  try {
    await client.query("begin");

    // Planes
    const planeIdByCode = new Map<string, string>();
    for (const p of lore.planes) {
      const res = await client.query(
        "insert into lore_planes(code, name, era_tags, is_active) values ($1, $2, $3, $4) on conflict (code) do update set name=excluded.name, era_tags=excluded.era_tags, is_active=excluded.is_active returning id",
        [p.code, p.name, p.eraTags ?? [], p.isActive ?? true]
      );
      planeIdByCode.set(p.code, res.rows[0].id);
    }

    // Factions
    for (const f of lore.factions) {
      const planeId = planeIdByCode.get(f.planeCode);
      if (!planeId) throw new Error(`Unknown planeCode in faction seed: ${f.planeCode}`);
      await client.query(
        "insert into lore_factions(plane_id, code, name, color_identity, allowed_kinships, is_active) values ($1, $2, $3, $4, $5, $6) on conflict (plane_id, code) do update set name=excluded.name, color_identity=excluded.color_identity, allowed_kinships=excluded.allowed_kinships, is_active=excluded.is_active",
        [planeId, f.code, f.name, f.colorIdentity, f.allowedKinships ?? [], f.isActive ?? true]
      );
    }

    // Kinships
    const kinshipIdByType = new Map<string, string>();
    for (const k of lore.kinships) {
      const res = await client.query(
        "insert into lore_kinships(creature_type, plane_codes, is_active) values ($1, $2, $3) on conflict (creature_type) do update set plane_codes=excluded.plane_codes, is_active=excluded.is_active returning id",
        [k.creatureType, k.planeCodes ?? [], k.isActive ?? true]
      );
      kinshipIdByType.set(k.creatureType, res.rows[0].id);
    }

    // Classes
    const classIdByCode = new Map<string, string>();
    for (const c of lore.classes) {
      const res = await client.query(
        "insert into lore_classes(code, name, description, allowed_archetypes, is_active) values ($1, $2, $3, $4, $5) on conflict (code) do update set name=excluded.name, description=excluded.description, allowed_archetypes=excluded.allowed_archetypes, is_active=excluded.is_active returning id",
        [c.code, c.name, c.description, c.allowedArchetypeCodes ?? [], c.isActive ?? true]
      );
      classIdByCode.set(c.code, res.rows[0].id);
    }

    // Archetypes
    const archetypeIdByCode = new Map<string, string>();
    for (const a of lore.archetypes) {
      const res = await client.query(
        "insert into lore_archetypes(code, name, description, required_tags, banned_tags, is_active) values ($1, $2, $3, $4, $5, $6) on conflict (code) do update set name=excluded.name, description=excluded.description, required_tags=excluded.required_tags, banned_tags=excluded.banned_tags, is_active=excluded.is_active returning id",
        [
          a.code,
          a.name,
          a.description,
          JSON.stringify(a.requiredTags ?? []),
          JSON.stringify(a.bannedTags ?? []),
          a.isActive ?? true
        ]
      );
      archetypeIdByCode.set(a.code, res.rows[0].id);
    }

    // Ruleset + Talent packages
    const rulesetId = await upsertRuleset(talents.rulesetVersion);

    for (const p of talents.packages) {
      const archetypeId = archetypeIdByCode.get(p.archetypeCode);
      if (!archetypeId) throw new Error(`Unknown archetypeCode in talent seed: ${p.archetypeCode}`);
      await client.query(
        "insert into talent_packages(ruleset_id, archetype_id, level_min, level_max, bracket_min, bracket_max, name, rules_text, keywords, mana_value_delta, stats_delta, weight, is_active) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)",
        [
          rulesetId,
          archetypeId,
          p.levelMin,
          p.levelMax,
          p.bracketMin,
          p.bracketMax,
          p.name,
          p.rulesText,
          p.keywords ?? [],
          p.manaValueDelta ?? 0,
          JSON.stringify(p.statsDelta ?? {}),
          p.weight ?? 1
        ]
      );
    }

    await client.query("commit");
    console.log("Seed complete");
  } catch (e) {
    await client.query("rollback");
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
