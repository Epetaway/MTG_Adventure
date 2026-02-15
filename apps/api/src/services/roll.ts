import crypto from 'node:crypto';

export function rollD20(): number {
  return crypto.randomInt(1, 21);
}

export function makeAuditHash(input: {
  characterId: string;
  roll: number;
  timestampIso: string;
  talentPackageId: string;
  secret: string;
}): string {
  const raw = `${input.characterId}|${input.roll}|${input.timestampIso}|${input.talentPackageId}|${input.secret}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, i) => sum + Math.max(0, i.weight), 0);
  if (total <= 0) throw new Error('No weighted items available');
  let r = Math.random() * total;
  for (const item of items) {
    r -= Math.max(0, item.weight);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
