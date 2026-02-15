import { z } from 'zod';

export const BracketSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5)
]);

export const ColorIdentitySchema = z
  .string()
  .regex(/^[WUBRG]{0,5}$/, 'Invalid color identity format');

export const LorePlaneSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  eraTags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const LoreFactionSchema = z.object({
  id: z.string().uuid(),
  planeId: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  colorIdentity: ColorIdentitySchema,
  allowedKinships: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const LoreKinshipSchema = z.object({
  id: z.string().uuid(),
  creatureType: z.string().min(2),
  planeCodes: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const LoreClassSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(2),
  allowedArchetypeCodes: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const LoreArchetypeSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(2),
  requiredTags: z.array(z.any()).default([]),
  bannedTags: z.array(z.any()).default([]),
  isActive: z.boolean().default(true)
});

export const RulesetSchema = z.object({
  id: z.string().uuid(),
  version: z.string().min(3),
  notes: z.string().default('')
});

export const TalentPackageSchema = z.object({
  id: z.string().uuid(),
  rulesetId: z.string().uuid(),
  archetypeId: z.string().uuid(),
  levelMin: z.number().int().min(1),
  levelMax: z.number().int().min(1),
  bracketMin: z.number().int().min(1).max(5),
  bracketMax: z.number().int().min(1).max(5),
  name: z.string().min(2),
  rulesText: z.string().min(5),
  keywords: z.array(z.string()).default([]),
  manaValueDelta: z.number().int().default(0),
  statsDelta: z
    .object({
      power: z.number().int().optional(),
      toughness: z.number().int().optional()
    })
    .default({}),
  weight: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true)
});

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(2),
  planeId: z.string().uuid(),
  factionId: z.string().uuid(),
  kinshipId: z.string().uuid(),
  classId: z.string().uuid(),
  archetypeId: z.string().uuid(),
  colorIdentity: ColorIdentitySchema,
  level: z.number().int().min(1).default(1),
  xpTotal: z.number().int().min(0).default(0),
  bracketCap: BracketSchema.default(1),
  portraitUrl: z.string().url().nullable().optional(),
  cardVersion: z.number().int().min(1).default(1)
});

export const CreateCharacterInputSchema = z.object({
  name: z.string().min(2),
  planeId: z.string().uuid(),
  factionId: z.string().uuid(),
  kinshipId: z.string().uuid(),
  classId: z.string().uuid(),
  archetypeId: z.string().uuid(),
  chosenColorIdentity: ColorIdentitySchema,
  portraitUrl: z.string().url().nullable().optional()
});

export const XpEventTypeSchema = z.enum([
  'match_log',
  'quest',
  'seasonal',
  'admin_adjustment'
]);

export const XpEventSchema = z.object({
  id: z.string().uuid(),
  characterId: z.string().uuid(),
  type: XpEventTypeSchema,
  value: z.number().int(),
  evidenceRef: z.string().nullable().optional(),
  createdAt: z.string()
});

export const CharacterUnlockSchema = z.object({
  id: z.string().uuid(),
  characterId: z.string().uuid(),
  level: z.number().int().min(1),
  roll: z.number().int().min(1).max(20),
  talentPackageId: z.string().uuid(),
  rerollOfUnlockId: z.string().uuid().nullable().optional(),
  createdAt: z.string()
});

export const DeckSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  characterId: z.string().uuid(),
  name: z.string().min(2),
  bracket: BracketSchema,
  isRegistered: z.boolean().default(false),
  lastValidatedAt: z.string().nullable().optional()
});

export const DeckCardSchema = z.object({
  cardName: z.string().min(1),
  qty: z.number().int().min(1).max(99).default(1),
  tags: z.array(z.string()).default([])
});

export const DeckImportInputSchema = z.object({
  lines: z.array(z.string().min(1)).min(1)
});

export const ValidationSeveritySchema = z.enum(['error', 'warning', 'info']);

export const ValidationIssueSchema = z.object({
  code: z.string().min(3),
  severity: ValidationSeveritySchema,
  message: z.string().min(3),
  details: z.record(z.any()).default({})
});

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  bracket: BracketSchema,
  issues: z.array(ValidationIssueSchema),
  suggestedFixes: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      suggestedCards: z.array(z.string()).default([])
    })
  )
});
/** View model: Character with nested unlocks, XP events, and gating info */
export const CharacterSheetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(2),
  planeId: z.string().uuid(),
  factionId: z.string().uuid(),
  kinshipId: z.string().uuid(),
  classId: z.string().uuid(),
  archetypeId: z.string().uuid(),
  colorIdentity: ColorIdentitySchema,
  level: z.number().int().min(1),
  xpTotal: z.number().int().min(0),
  bracketCap: BracketSchema,
  portraitUrl: z.string().url().nullable(),
  cardVersion: z.number().int().min(1),
  unlocks: z.array(CharacterUnlockSchema).default([]),
  recentXpEvents: z.array(XpEventSchema).default([]),
  nextLevelAt: z.number().int().min(0),
  eligibleToLevelUp: z.boolean(),
  gatingRules: z.object({
    allowedBrackets: z.array(BracketSchema),
    hasColorIdentityConflict: z.boolean(),
    loreLockedReason: z.string().nullable()
  })
});

/** View model: Deck import parsing result */
export const DeckImportOutputSchema = z.object({
  cards: z.array(
    z.object({
      cardName: z.string().min(1),
      qty: z.number().int().min(1).max(99)
    })
  )
});