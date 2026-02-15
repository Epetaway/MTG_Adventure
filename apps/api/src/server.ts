import { randomUUID } from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
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
import { query } from './db.js';
import { registerLoreRoutes } from './routes/loreRoutes.js';
import { registerCharacterRoutes } from './routes/characterRoutes.js';
import { registerLevelUpRoutes } from './routes/levelUpRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const api = express.Router();
api.get('/health', (_req, res) => res.json({ ok: true }));

api.post('/characters', (req, res) => {
  const parsed = CreateCharacterInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const character = {
    id: randomUUID(),
    userId: 'TODO',
    ...parsed.data,
    colorIdentity: parsed.data.chosenColorIdentity,
    level: 1,
    xpTotal: 0,
    bracketCap: 1,
    cardVersion: 1
  };

  return respondWithSchema(res, CharacterSchema, character, 201);
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

app.use('/api', api);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
