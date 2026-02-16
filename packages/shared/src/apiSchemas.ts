import { z } from 'zod';
import {
  BracketSchema,
  CharacterSchema,
  CharacterUnlockSchema,
  MatchParticipantSchema,
  MatchSchema,
  MatchCreateResponseSchema,
  MatchLogResultsInputSchema,
  MatchCreateInputSchema,
  RulesetSchema,
  TalentPackageSchema,
  XpEventSchema
} from './schemas.js';

export const LoreListResponseSchema = z.object({
  items: z.array(z.any())
});

/**
 * Character Sheet Read Model (UI contract)
 * This is what your Character Sheet page consumes.
 */
export const CharacterSheetSchema = z.object({
  character: CharacterSchema,
  lore: z.object({
    plane: z.object({ id: z.string().uuid(), code: z.string(), name: z.string() }),
    faction: z.object({ id: z.string().uuid(), code: z.string(), name: z.string() }),
    kinship: z.object({ id: z.string().uuid(), creatureType: z.string() }),
    class: z.object({ id: z.string().uuid(), code: z.string(), name: z.string() }),
    archetype: z.object({ id: z.string().uuid(), code: z.string(), name: z.string() })
  }),
  unlocks: z.array(CharacterUnlockSchema),
  recentXpEvents: z.array(XpEventSchema),
  xp: z.object({
    total: z.number().int(),
    nextLevelAt: z.number().int(),
    eligibleToLevelUp: z.boolean(),
    remainingToNext: z.number().int()
  }),
  gating: z.object({
    bracketCap: BracketSchema,
    deckBracketMaxAllowed: BracketSchema,
    notes: z.array(z.string()).default([])
  }),
  ruleset: RulesetSchema
});

/**
 * Level-up result model
 */
export const LevelUpResultSchema = z.object({
  characterId: z.string().uuid(),
  newLevel: z.number().int().min(1),
  newCardVersion: z.number().int().min(1),
  roll: z.number().int().min(1).max(20),
  auditHash: z.string().min(16),
  unlock: CharacterUnlockSchema,
  talent: TalentPackageSchema,
  xp: z.object({
    total: z.number().int(),
    nextLevelAt: z.number().int(),
    eligibleToLevelUp: z.boolean(),
    remainingToNext: z.number().int()
  })
});

export const MatchLogResultsResponseSchema = z.object({
  match: MatchSchema,
  participants: z.array(MatchParticipantSchema),
  xpEvents: z.array(XpEventSchema),
  characters: z.array(
    z.object({
      id: z.string().uuid(),
      xpTotal: z.number().int(),
      nextLevelAt: z.number().int(),
      eligibleToLevelUp: z.boolean(),
      remainingToNext: z.number().int()
    })
  )
});

export const MatchCreateSchemas = {
  input: MatchCreateInputSchema,
  response: MatchCreateResponseSchema
};

export const MatchLogResultsSchemas = {
  input: MatchLogResultsInputSchema,
  response: MatchLogResultsResponseSchema
};
