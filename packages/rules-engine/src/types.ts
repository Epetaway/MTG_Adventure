export type Bracket = 1 | 2 | 3 | 4 | 5;

export type CharacterContext = {
  id: string;
  level: number;
  bracketCap: Bracket;
  colorIdentity: string;
  archetypeCode: string;
};

export type DeckCard = {
  cardName: string;
  qty: number;
  tags?: string[];
};

export type DeckContext = {
  id: string;
  bracket: Bracket;
  cards: DeckCard[];
};

export type RulesetContext = {
  version: string;
  bracketRules: Record<
    Bracket,
    {
      maxGameChangers: number | null;
      allowTwoCardInfinite: boolean;
      allowExtraTurns: boolean;
      allowMassLandDenial: boolean;
      allowTutors: boolean;
    }
  >;
};

export type ValidationIssue = {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown>;
};

export type ValidationResult = {
  isValid: boolean;
  bracket: Bracket;
  issues: ValidationIssue[];
  suggestedFixes: Array<{
    title: string;
    description: string;
    suggestedCards: string[];
  }>;
};
