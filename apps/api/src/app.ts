import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import {
  CreateCharacterInputSchema,
  DeckImportInputSchema,
  DeckImportOutputSchema,
  ValidationResultSchema,
  CharacterSchema
} from '@cc/shared';
import { defaultRuleset, validateDeck } from '@cc/rules-engine';
import { respondWithSchema } from './http/respond.js';
import { registerLoreRoutes } from './routes/loreRoutes.js';
import { registerCharacterRoutes } from './routes/characterRoutes.js';
import { registerLevelUpRoutes } from './routes/levelUpRoutes.js';
import { registerMatchRoutes } from './routes/matchRoutes.js';
import { registerAuthRoutes } from './routes/authRoutes.js';
import { requireAuth, requireCharacterOwner } from './middleware/auth.js';
import { pool } from './db.js';



export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true }));

  // Auth routes (register, login, me)
  registerAuthRoutes(api);

  // Character creation now requires JWT auth
  api.post('/characters', requireAuth, async (req, res) => {
    const parsed = CreateCharacterInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
      const userId = req.user!.id;

      const insert = await pool.query(
        'insert into characters(user_id, name, plane_id, faction_id, kinship_id, class_id, archetype_id, color_identity, level, xp_total, bracket_cap, portrait_url, card_version) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id, user_id as "userId", name, plane_id as "planeId", faction_id as "factionId", kinship_id as "kinshipId", class_id as "classId", archetype_id as "archetypeId", color_identity as "colorIdentity", level, xp_total as "xpTotal", bracket_cap as "bracketCap", portrait_url as "portraitUrl", card_version as "cardVersion"',
        [
          userId,
          parsed.data.name,
          parsed.data.planeId,
          parsed.data.factionId,
          parsed.data.kinshipId,
          parsed.data.classId,
          parsed.data.archetypeId,
          parsed.data.chosenColorIdentity,
          1,
          0,
          1,
          parsed.data.portraitUrl ?? null,
          1
        ]
      );

      return respondWithSchema(res, CharacterSchema, insert.rows[0], 201);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'CHARACTER_CREATE_FAILED' });
    }
  });

  api.post('/decks/validate', (req, res) => {
    const BodySchema = z.object({
      deck: z.object({
        id: z.string().min(1),
        bracket: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(5)
        ]),
        cards: z.array(
          z.object({
            cardName: z.string(),
            qty: z.number().int(),
            tags: z.array(z.string()).optional()
          })
        )
      }),
      character: z.object({
        id: z.string().min(1),
        level: z.number().int().min(1),
        bracketCap: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(5)
        ]),
        colorIdentity: z.string(),
        archetypeCode: z.string()
      })
    });

    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const result = validateDeck(
      parsed.data.deck,
      parsed.data.character,
      defaultRuleset
    );

    return respondWithSchema(res, ValidationResultSchema, {
      isValid: result.isValid,
      bracket: result.bracket,
      issues: result.issues,
      suggestedFixes: result.suggestedFixes
    });
  });

  api.post('/decks/import', (req, res) => {
    const parsed = DeckImportInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const cards = parsed.data.lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+)\s*x?\s*(.+)$/i);
        if (!match) {
          return { cardName: line, qty: 1 };
        }
        return { qty: Number(match[1]), cardName: match[2].trim() };
      });

    return respondWithSchema(res, DeckImportOutputSchema, { cards });
  });

  registerLoreRoutes(api);
  registerCharacterRoutes(api);
  registerLevelUpRoutes(api);
  registerMatchRoutes(api);
  // AuthRoutes already registered above

  app.use('/api', api);

  return app;
}
