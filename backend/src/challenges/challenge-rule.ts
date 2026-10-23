import { Difficulty } from "@prisma/client";

export const LEVEL_RULES: Record<
    Difficulty,
    { bugTypes: string[]; bugCount: string; lines: string; style: string }
> = {
    EASY: {
        bugTypes: [
            'wrong comparison operator', 'missing return statement', 'wrong variable name',
            'wrong arithmetic operator', 'wrong index', 'wrong initial value',
            'wrong string method', 'swapped function arguments',
        ],
        bugCount: '1',
        lines: '5 to 10',
        style: 'The bug should be easy to spot by reading carefully.',
    },
    MEDIUM: {
        bugTypes: [
            'off-by-one error', 'incorrect loop condition', 'string vs integer mix-up',
            'wrong loop range', 'condition checked in the wrong order', 'variable reset in the wrong place',
            'wrong boundary check', 'integer division vs normal division',
        ],
        bugCount: '2',
        lines: '10 to 20',
        style: 'The bugs should need tracing through the code step by step.',
    },
    HARD: {
        bugTypes: [
            'mutable default argument', 'edge case failure', 'shadowed variable',
            'modifying a list while looping over it', 'shallow copy instead of deep copy',
            'wrong use of a global variable', 'early return inside a loop',
            'dictionary key missing case',
        ],
        bugCount: '3',
        lines: '20 to 35',
        style: 'The code should look correct and pass simple inputs, but fail on edge cases.',
    },
};

export const TOPICS = ['lists', 'strings', 'dictionaries', 'loops', 'math', 'sets', 'tuples', 'conditions'];