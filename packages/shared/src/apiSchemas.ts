import { z } from 'zod';
import {
  BracketSchema,
  CharacterSchema,
  CharacterUnlockSchema,
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
