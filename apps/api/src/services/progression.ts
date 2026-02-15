export function nextLevelXpThreshold(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

export function computeEligibility(level: number, xpTotal: number) {
  const nextLevelAt = nextLevelXpThreshold(level + 1);
  const eligibleToLevelUp = xpTotal >= nextLevelAt;
  return {
    total: xpTotal,
    nextLevelAt,
    eligibleToLevelUp,
    remainingToNext: Math.max(0, nextLevelAt - xpTotal)
  };
}

export function bracketCapFromLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  if (level <= 7) return 3;
  if (level <= 12) return 4;
  return 5;
}
