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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

function getQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

app.get('/api/lore/planes', async (_req, res) => {
  try {
    const rows = await query<{ id: string; code: string; name: string; eraTags: string[]; isActive: boolean }>(
      'select id, code, name, era_tags as "eraTags", is_active as "isActive" from lore_planes where is_active = true order by name'
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load planes.' });
  }
});

app.get('/api/lore/factions', async (req, res) => {
  const planeCode = getQueryParam(req.query.planeCode);

  try {
    if (planeCode) {
      const rows = await query<{ id: string; planeId: string; code: string; name: string; colorIdentity: string; allowedKinships: string[]; isActive: boolean }>(
        'select f.id, f.plane_id as "planeId", f.code, f.name, f.color_identity as "colorIdentity", f.allowed_kinships as "allowedKinships", f.is_active as "isActive" from lore_factions f join lore_planes p on p.id = f.plane_id where f.is_active = true and p.code = $1 order by f.name',
        [planeCode]
      );
      return res.json(rows);
    }

    const rows = await query<{ id: string; planeId: string; code: string; name: string; colorIdentity: string; allowedKinships: string[]; isActive: boolean }>(
      'select id, plane_id as "planeId", code, name, color_identity as "colorIdentity", allowed_kinships as "allowedKinships", is_active as "isActive" from lore_factions where is_active = true order by name'
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load factions.' });
  }
});

app.get('/api/lore/kinships', async (req, res) => {
  const planeCode = getQueryParam(req.query.planeCode);
  const factionCode = getQueryParam(req.query.factionCode);

  try {
    if (factionCode) {
      const factionRows = await query<{ allowedKinships: string[]; planeCode: string }>(
        'select f.allowed_kinships as "allowedKinships", p.code as "planeCode" from lore_factions f join lore_planes p on p.id = f.plane_id where f.is_active = true and f.code = $1',
        [factionCode]
      );

      const allowed = factionRows[0]?.allowedKinships ?? [];
      const factionPlane = factionRows[0]?.planeCode;
      const targetPlane = planeCode ?? factionPlane;

      if (allowed.length === 0) {
        return res.json([]);
      }

      const rows = await query<{ id: string; creatureType: string; planeCodes: string[]; isActive: boolean }>(
        'select id, creature_type as "creatureType", plane_codes as "planeCodes", is_active as "isActive" from lore_kinships where is_active = true and creature_type = any($1) and ($2::text is null or plane_codes @> array[$2]::text[]) order by creature_type',
        [allowed, targetPlane ?? null]
      );
      return res.json(rows);
    }

    if (planeCode) {
      const rows = await query<{ id: string; creatureType: string; planeCodes: string[]; isActive: boolean }>(
        'select id, creature_type as "creatureType", plane_codes as "planeCodes", is_active as "isActive" from lore_kinships where is_active = true and plane_codes @> array[$1]::text[] order by creature_type',
        [planeCode]
      );
      return res.json(rows);
    }

    const rows = await query<{ id: string; creatureType: string; planeCodes: string[]; isActive: boolean }>(
      'select id, creature_type as "creatureType", plane_codes as "planeCodes", is_active as "isActive" from lore_kinships where is_active = true order by creature_type'
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load kinships.' });
  }
});

app.get('/api/lore/classes', async (_req, res) => {
  try {
    const rows = await query<{ id: string; code: string; name: string; description: string; allowedArchetypeCodes: string[]; isActive: boolean }>(
      'select id, code, name, description, allowed_archetypes as "allowedArchetypeCodes", is_active as "isActive" from lore_classes where is_active = true order by name'
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load classes.' });
  }
});

app.get('/api/lore/archetypes', async (_req, res) => {
  try {
    const rows = await query<{ id: string; code: string; name: string; description: string; requiredTags: unknown[]; bannedTags: unknown[]; isActive: boolean }>(
      'select id, code, name, description, required_tags as "requiredTags", banned_tags as "bannedTags", is_active as "isActive" from lore_archetypes where is_active = true order by name'
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load archetypes.' });
  }
});

app.post('/api/characters', (req, res) => {
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

app.post('/api/decks/validate', (req, res) => {
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

app.post('/api/decks/import', (req, res) => {
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

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
