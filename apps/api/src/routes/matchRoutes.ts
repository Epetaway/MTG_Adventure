import type { Router } from 'express';
import { pool } from '../db.js';
import { respondWithSchema } from '../http/respond.js';
import {
  MatchCreateInputSchema,
  MatchCreateResponseSchema,
  MatchLogResultsInputSchema,
  MatchLogResultsResponseSchema
} from '@cc/shared';
import { computeEligibility } from '../services/progression.js';

async function resolveUserId(req: { header: (name: string) => string | undefined }) {
  const headerUserId = req.header('x-user-id');
  if (headerUserId) return { id: headerUserId };

  const email = req.header('x-user-email');
  if (!email) return null;

  const handleHeader = req.header('x-user-handle');
  const handle = handleHeader
    ? handleHeader
    : email.split('@')[0].replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

  const userRes = await pool.query(
    'insert into users(email, handle, password_hash) values ($1, $2, $3) on conflict (email) do update set handle = excluded.handle returning id, email, handle, role',
    [email, handle, 'stub-hash']
  );

  return userRes.rows[0] as { id: string; email: string; handle: string; role: string };
}

async function getActiveRuleset() {
  const { rows } = await pool.query(
    'select id, version, notes from rulesets order by created_at desc limit 1'
  );
  if (!rows[0]) throw new Error('No ruleset found. Did you seed rulesets?');
  return rows[0] as { id: string; version: string; notes: string };
}

export function registerMatchRoutes(router: Router) {
  router.post('/matches', async (req, res) => {
    const parsed = MatchCreateInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
      const resolved = await resolveUserId(req);
      const ruleset = parsed.data.rulesetId
        ? { id: parsed.data.rulesetId }
        : await getActiveRuleset();

      const insert = await pool.query(
        'insert into matches(ruleset_id, mode, bracket, status, started_at, created_by, tournament_ref) values ($1, $2, $3, $4, $5, $6, $7) returning id, status, started_at as "startedAt"',
        [
          ruleset.id,
          parsed.data.mode,
          parsed.data.bracket,
          'created',
          parsed.data.startedAt ?? new Date().toISOString(),
          resolved?.id ?? null,
          parsed.data.tournamentRef ?? null
        ]
      );

      return respondWithSchema(res, MatchCreateResponseSchema, insert.rows[0], 201);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'MATCH_CREATE_FAILED' });
    }
  });

  router.post('/matches/:id/log-results', async (req, res) => {
    const matchId = req.params.id;
    const parsed = MatchLogResultsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const participantIds = parsed.data.participants.map((p) => p.characterId);
    const uniqueIds = new Set(participantIds);
    if (uniqueIds.size !== participantIds.length) {
      return res.status(400).json({ error: 'DUPLICATE_CHARACTER_IDS' });
    }

    const client = await pool.connect();
    try {
      const resolved = await resolveUserId(req);
      await client.query('begin');

      const matchQ = await client.query(
        'select id, started_at as "startedAt", xp_awarded as "xpAwarded" from matches where id = $1 for update',
        [matchId]
      );

      if (!matchQ.rows[0]) {
        await client.query('rollback');
        return res.status(404).json({ error: 'MATCH_NOT_FOUND' });
      }

      if (matchQ.rows[0].xpAwarded) {
        await client.query('rollback');
        return res.status(409).json({ error: 'MATCH_ALREADY_FINALIZED' });
      }

      const characterQ = await client.query(
        'select id from characters where id = any($1) for update',
        [participantIds]
      );

      if (characterQ.rows.length !== participantIds.length) {
        await client.query('rollback');
        return res.status(400).json({ error: 'CHARACTER_NOT_FOUND' });
      }

      const participantValues: unknown[] = [];
      const participantTuples = parsed.data.participants.map((participant, index) => {
        const isWinner = participant.isWinner ?? participant.placement === 1;
        const baseIndex = index * 5;
        participantValues.push(
          matchId,
          participant.characterId,
          participant.placement ?? null,
          participant.xpValue,
          isWinner
        );
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
      });

      const participantsInsert = await client.query(
        `insert into match_participants(match_id, character_id, placement, xp_value, is_winner)
         values ${participantTuples.join(', ')}
         returning id, match_id as "matchId", character_id as "characterId", placement, xp_value as "xpValue", is_winner as "isWinner", recorded_at as "recordedAt"`,
        participantValues
      );

      const xpEventValues: unknown[] = [];
      const xpEventTuples = parsed.data.participants.map((participant, index) => {
        const baseIndex = index * 5;
        xpEventValues.push(
          participant.characterId,
          'match_log',
          participant.xpValue,
          matchId,
          resolved?.id ?? null
        );
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
      });

      const xpInsert = await client.query(
        `insert into xp_events(character_id, type, value, evidence_ref, created_by)
         values ${xpEventTuples.join(', ')}
         returning id, character_id as "characterId", type, value, evidence_ref as "evidenceRef", created_at as "createdAt"`,
        xpEventValues
      );

      const updateValues: unknown[] = [];
      const updateTuples = parsed.data.participants.map((participant, index) => {
        const baseIndex = index * 2;
        updateValues.push(participant.characterId, participant.xpValue);
        return `($${baseIndex + 1}, $${baseIndex + 2})`;
      });

      const updatedCharacters = await client.query(
        `update characters as c
         set xp_total = c.xp_total + v.xp_value
         from (values ${updateTuples.join(', ')}) as v(id, xp_value)
         where c.id = v.id
         returning c.id, c.level, c.xp_total as "xpTotal"`,
        updateValues
      );

      const endTime = parsed.data.endedAt ?? new Date().toISOString();
      let durationSeconds = parsed.data.durationSeconds ?? null;
      if (durationSeconds === null && matchQ.rows[0].startedAt) {
        const startedMs = new Date(matchQ.rows[0].startedAt).getTime();
        const endedMs = new Date(endTime).getTime();
        durationSeconds = Math.max(0, Math.floor((endedMs - startedMs) / 1000));
      }

      const matchUpdate = await client.query(
        'update matches set status = $1, ended_at = $2, duration_seconds = $3, xp_awarded = true where id = $4 returning id, ruleset_id as "rulesetId", mode, bracket, status, started_at as "startedAt", ended_at as "endedAt", duration_seconds as "durationSeconds", tournament_ref as "tournamentRef", xp_awarded as "xpAwarded"',
        ['finalized', endTime, durationSeconds, matchId]
      );

      await client.query('commit');

      const characterSummaries = updatedCharacters.rows.map((row: { id: string; level: number; xpTotal: number }) => {
        const xp = computeEligibility(row.level, row.xpTotal);
        return { id: row.id, xpTotal: row.xpTotal, ...xp };
      });

      return respondWithSchema(
        res,
        MatchLogResultsResponseSchema,
        {
          match: matchUpdate.rows[0],
          participants: participantsInsert.rows,
          xpEvents: xpInsert.rows,
          characters: characterSummaries
        },
        200
      );
    } catch (error) {
      await client.query('rollback');
      console.error(error);
      return res.status(500).json({ error: 'MATCH_RESULTS_FAILED' });
    } finally {
      client.release();
    }
  });
}
