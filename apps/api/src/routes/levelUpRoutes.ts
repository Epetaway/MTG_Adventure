import type { Router } from 'express';
import 'dotenv/config';
import { pool } from '../db.js';
import { respondWithSchema } from '../http/respond.js';
import { LevelUpResultSchema } from '@cc/shared';
import { bracketCapFromLevel, computeEligibility } from '../services/progression.js';
import { makeAuditHash, pickWeighted, rollD20 } from '../services/roll.js';

async function getActiveRuleset() {
  const { rows } = await pool.query(
    'select id, version, notes from rulesets order by created_at desc limit 1'
  );
  if (!rows[0]) throw new Error('No ruleset found. Did you seed rulesets?');
  return rows[0] as { id: string; version: string; notes: string };
}

export function registerLevelUpRoutes(router: Router) {
  router.post('/characters/:id/level-up/roll', async (req, res) => {
    const characterId = req.params.id;
    const ruleset = await getActiveRuleset();

    const client = await pool.connect();
    try {
      await client.query('begin');

      const charQ = await client.query(
        'select id, user_id as "userId", archetype_id as "archetypeId", level, xp_total as "xpTotal", bracket_cap as "bracketCap", card_version as "cardVersion" from characters where id = $1 for update',
        [characterId]
      );

      if (!charQ.rows[0]) {
        await client.query('rollback');
        return res.status(404).json({ error: 'CHARACTER_NOT_FOUND' });
      }

      const character = charQ.rows[0] as {
        id: string;
        userId: string;
        archetypeId: string;
        level: number;
        xpTotal: number;
        bracketCap: number;
        cardVersion: number;
      };

      const xp = computeEligibility(character.level, character.xpTotal);
      if (!xp.eligibleToLevelUp) {
        await client.query('rollback');
        return res.status(409).json({
          error: 'NOT_ELIGIBLE_TO_LEVEL_UP',
          details: xp
        });
      }

      const nextLevel = character.level + 1;
      const nextBracketCap = bracketCapFromLevel(nextLevel);
      const roll = rollD20();

      const pkgQ = await client.query(
        'select id, ruleset_id as "rulesetId", archetype_id as "archetypeId", level_min as "levelMin", level_max as "levelMax", bracket_min as "bracketMin", bracket_max as "bracketMax", name, rules_text as "rulesText", keywords, mana_value_delta as "manaValueDelta", stats_delta as "statsDelta", weight, is_active as "isActive" from talent_packages where ruleset_id = $1 and archetype_id = $2 and is_active = true and $3 between level_min and level_max and $4 between bracket_min and bracket_max',
        [ruleset.id, character.archetypeId, nextLevel, nextBracketCap]
      );

      if (pkgQ.rows.length === 0) {
        await client.query('rollback');
        return res.status(500).json({
          error: 'NO_TALENT_PACKAGES_AVAILABLE',
          details: { nextLevel, nextBracketCap }
        });
      }

      const selected = pickWeighted(
        pkgQ.rows.map((row: { id: string; weight: number }) => ({
          ...row,
          weight: row.weight ?? 1
        }))
      );

      const timestampIso = new Date().toISOString();
      const secret = process.env.ROLL_AUDIT_SECRET || 'dev-secret-change-me';
      const auditHash = makeAuditHash({
        characterId,
        roll,
        timestampIso,
        talentPackageId: selected.id,
        secret
      });

      const unlockInsert = await client.query(
        'insert into character_unlocks(character_id, level, roll, audit_hash, talent_package_id, created_at) values ($1, $2, $3, $4, $5, $6) returning id, character_id as "characterId", level, roll, talent_package_id as "talentPackageId", reroll_of_unlock_id as "rerollOfUnlockId", created_at as "createdAt"',
        [characterId, nextLevel, roll, auditHash, selected.id, timestampIso]
      );

      const newCardVersion = character.cardVersion + 1;
      await client.query(
        'update characters set level = $1, bracket_cap = $2, card_version = $3 where id = $4',
        [nextLevel, nextBracketCap, newCardVersion, characterId]
      );

      await client.query('commit');

      const newXp = computeEligibility(nextLevel, character.xpTotal);

      const payload = {
        characterId,
        newLevel: nextLevel,
        newCardVersion,
        roll,
        auditHash,
        unlock: unlockInsert.rows[0],
        talent: selected,
        xp: newXp
      };

      return respondWithSchema(res, LevelUpResultSchema, payload, 200);
    } catch (error) {
      await client.query('rollback');
      console.error(error);
      return res.status(500).json({ error: 'LEVEL_UP_FAILED' });
    } finally {
      client.release();
    }
  });
}
