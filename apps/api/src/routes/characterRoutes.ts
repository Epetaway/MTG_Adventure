import type { Router } from 'express';
import { pool } from '../db.js';
import { respondWithSchema } from '../http/respond.js';
import { CharacterSheetSchema } from '@cc/shared';
import { bracketCapFromLevel, computeEligibility } from '../services/progression.js';
import { gatingNotesForBracket } from '../services/gatingNotes.js';

async function getActiveRuleset() {
  const { rows } = await pool.query(
    'select id, version, notes from rulesets order by created_at desc limit 1'
  );
  if (!rows[0]) throw new Error('No ruleset found. Did you seed rulesets?');
  return rows[0] as { id: string; version: string; notes: string };
}

export function registerCharacterRoutes(router: Router) {
  router.get('/characters/:id', async (req, res) => {
    const characterId = req.params.id;

    const ruleset = await getActiveRuleset();

    const characterQ = await pool.query(
      'select c.id, c.user_id as "userId", c.name, c.plane_id as "planeId", c.faction_id as "factionId", c.kinship_id as "kinshipId", c.class_id as "classId", c.archetype_id as "archetypeId", c.color_identity as "colorIdentity", c.level, c.xp_total as "xpTotal", c.bracket_cap as "bracketCap", c.portrait_url as "portraitUrl", c.card_version as "cardVersion" from characters c where c.id = $1 limit 1',
      [characterId]
    );

    if (!characterQ.rows[0]) return res.status(404).json({ error: 'CHARACTER_NOT_FOUND' });

    const character = characterQ.rows[0];

    const computedCap = bracketCapFromLevel(character.level);
    if (character.bracketCap !== computedCap) {
      await pool.query('update characters set bracket_cap = $1 where id = $2', [
        computedCap,
        characterId
      ]);
      character.bracketCap = computedCap;
    }

    const unlocksQ = await pool.query(
      'select id, character_id as "characterId", level, roll, talent_package_id as "talentPackageId", reroll_of_unlock_id as "rerollOfUnlockId", created_at as "createdAt" from character_unlocks where character_id = $1 order by created_at asc',
      [characterId]
    );

    const recentXpQ = await pool.query(
      'select id, character_id as "characterId", type, value, evidence_ref as "evidenceRef", created_at as "createdAt" from xp_events where character_id = $1 order by created_at desc limit 20',
      [characterId]
    );

    const xp = computeEligibility(character.level, character.xpTotal);

    const payload = {
      character,
      unlocks: unlocksQ.rows,
      recentXpEvents: recentXpQ.rows,
      xp,
      gating: {
        bracketCap: character.bracketCap,
        deckBracketMaxAllowed: character.bracketCap,
        notes: gatingNotesForBracket(character.bracketCap)
      },
      ruleset
    };

    return respondWithSchema(res, CharacterSheetSchema, payload, 200);
  });
}
