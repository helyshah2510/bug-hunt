export type Level ='EASY'|'MEDIUM'|'HARD';
export type CaseState='LOCKED'|'OPEN'|'SOLVED'|'SKIPPED';

export type CaseItem = { id: string; title: string; difficulty: Level; order: number; state: CaseState };
export type Me = { username: string; xp: number; attemptsLeft: number; lockedUntil: string | null };