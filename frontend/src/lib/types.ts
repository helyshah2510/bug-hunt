export type Level ='EASY'|'MEDIUM'|'HARD';
export type CaseState='LOCKED'|'OPEN'|'SOLVED'|'SKIPPED';

export type CaseItem = { id: string; title: string; difficulty: Level; order: number; state: CaseState };
export type Me = { username: string; xp: number; attemptsLeft: number; lockedUntil: string | null };

export type CaseDetail = {
    id: string; title: string; description: string; difficulty: Level; order: number;
    brokenCode: string; status: 'IN_PROGRESS' | 'SOLVED' | 'SKIPPED';
    hintsUsed: number; hintsTotal: number; hints: string[]; explanation?: string;
    solveReward: number; hintCost: number; skipCost: number;
};
export type RunResult = { outcome: 'success' | 'timeout' | 'memory' | 'error'; output: string | null; error: string | null };
export type SubmitResult = { passed: boolean; passedTests: number; totalTests: number; attemptsLeft?: number; lockedUntil?: string | null; xpEarned: number; explanation?: string };