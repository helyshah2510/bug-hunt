import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import { RunnerService } from "../runner/runner.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { Difficulty } from "@prisma/client";
import type { ChallengeDifficulty } from './challenges.types.js';
import { LEVEL_RULES, TOPICS } from "./challenge-rule.js";

const DIFFICULTY_TO_DB: Record<ChallengeDifficulty, Difficulty> = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
};

@Injectable()
export class ChallengeGeneratorService {
    private readonly ai: GoogleGenAI;
    constructor(
        private readonly configService: ConfigService,
        private readonly runnerService: RunnerService,
        private readonly prisma: PrismaService,
    ) {
        this.ai = new GoogleGenAI({
            apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
        });
    }

    async generateChallenge(difficulty: ChallengeDifficulty) {
        const dbDifficulty = DIFFICULTY_TO_DB[difficulty];
        const result = await this.prisma.challenge.aggregate({
            where: { difficulty: dbDifficulty },
            _max: { order: true },
        });

        const last =await this.prisma.challenge.findFirst({
            where:{difficulty},
            orderBy:{order:'desc'},
            select:{order:true},
        });
        const order=(last?.order??0)+1;
        const rules = LEVEL_RULES[dbDifficulty];
        const bugType = rules.bugTypes[Math.floor(Math.random() * rules.bugTypes.length)];
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

        const existing = await this.prisma.challenge.findMany({
            where: { difficulty: dbDifficulty },
            select: { title: true, brokenCode: true },
        });

        const existingTitle = existing.map((c) => c.title).join(',');
        const existingNames = existing.map((c) => c.brokenCode.match(/def\s+(\W+)/)?.[1]).filter(Boolean).join(',');

        const response = await this.ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: ` ${difficulty.toLowerCase()}-level Python debugging case for a
            detective-themed game called Bug Hunt.

            Return only a JSON object with these fields:
            {
                "title": "short case title",
                "description": "the debugging story and task",
                "difficulty": "${difficulty}",
                "brokenCode": "Python code containing a bug",
                "referenceSolution": "correct Python code",
                "testInputs": [
                "Python code that calls the function and prints its result"
                ],
                "hints": [
                "first gentle hint",
                "second more specific hint",
                "third strong hint"
                ],
                "explanation": "explain each bug and its fix simply"
            }
            Difficulty level: ${difficulty}
            - Number of bugs: ${rules.bugCount}
            - Main type of mistake: ${bugType}
            - Code length: about ${rules.lines} lines
            - ${rules.style}

            Requirements:
                - Use Python only.
               - The broken code must contain exactly ${rules.bugCount} separate mistake(s).
                At least one must be of the main type given above. Each mistake must be
                small and specific.
                - The broken code must print a DIFFERENT result from the reference solution
                on at least one test input. Rewriting the same logic in another style
                (a different loop, renamed variables) is NOT a bug.
                - The broken code and the reference solution must differ only by those
                mistakes. Keep everything else identical.
                - Both versions must use the same function name and the same parameters
                in the same order.
                - Include at least 3 test inputs. At least one must expose the bug,
                and at least one should give the same result in both versions.
                - Each test input must be Python code that calls the function and prints
                its result.
                - Do not include expected outputs; our backend will calculate them.
                - The description must not reveal where the bug is.
                - Return exactly 3 hints, from subtle to specific. Only the third
                hint may point at the faulty lines.
                - Do not wrap the JSON in Markdown code fences.
                - Do not reuse these titles: ${existingTitle || 'none yet'}
                - Do not reuse these function names: ${existingNames || 'none yet'}
                - The brokenCode must be ${rules.lines} lines long (not counting blank lines).
                - Reach that length with realistic code: several statements, helper variables,
                  or a small amount of setup. Do not pad it with comments or unused code.
                `,

        });
        const text = response.text;
        if (!text) {
            throw new Error('Gemini returned an empty response');
        }

        let challenge;

        try {
            challenge = JSON.parse(text);
        } catch {
            console.log('[gemini] start:', text.slice(0, 300));
            console.log('[gemini] start: ', text.slice(-200));
            throw new Error('Gemini didnt return valid JSON');
        }
        challenge.difficulty = difficulty;

        this.assertChallengeShape(challenge);

        const validation = await this.validateChallenge(challenge);
        const saved = await this.saveChallenge(challenge, validation.expectedOutput);

        return {
            id: saved.id,
            ...challenge,
            ...validation,
        };
    }

    // Small helper: is this value real text, not empty or just spaces?
    private isNotEmptyText(value: unknown): boolean {
        return typeof value === 'string' && value.trim().length > 0;
    }
    // Gate at the door: checks Gemini's JSON has every field we need.
    private assertChallengeShape(challenge: any): void {
        if (
            typeof challenge !== 'object' ||
            challenge === null ||
            Array.isArray(challenge)
        ) {
            throw new Error('Generated challenge has a bad shape its not a JSON object');
        }
        const problems: string[] = [];
        const textFields = [
            'title',
            'description',
            'difficulty',
            'brokenCode',
            'referenceSolution',
            'explanation',
        ];
        for (const field of textFields) {
            if (!this.isNotEmptyText(challenge[field])) {
                problems.push(`${field} is missing or empty`);
            }
        }

        if (
            !Array.isArray(challenge.testInputs) ||
            challenge.testInputs.length < 3 ||
            !challenge.testInputs.every((item: unknown) => this.isNotEmptyText(item))
        ) {
            problems.push('testInputs must have at least 3 items');
        }

        if (
            !Array.isArray(challenge.hints) ||
            challenge.hints.length !== 3 ||
            !challenge.hints.every((item: unknown) => this.isNotEmptyText(item))
        ) {
            problems.push('hints must be exactly 3');
        }

        // Cheap fake-bug check: saves 3 Judge0 runs on identical code
        if (
            this.isNotEmptyText(challenge.brokenCode) &&
            this.isNotEmptyText(challenge.referenceSolution) &&
            challenge.brokenCode.trim() === challenge.referenceSolution.trim()
        ) {
            problems.push('brokencode and referenceSolution are identical');
        }

        if (problems.length > 0) {
            throw new Error(`Generated challenge has a bad shape: ${problems.join(';')}`);
        }
    }

    async calculateExpectedOutputs(
        referenceSolution: string,
        testInputs: string[],
    ): Promise<string[]> {
        const results = await this.runnerService.runBatch(referenceSolution, testInputs);

        if (results.some((r) => !r.ok)) {
            throw new Error('The refrence solution failed while calculating expected outputs');
        }
        return results.map((r) => r.output.trim());
    }

    async validateChallenge(challenge: {
        referenceSolution: string;
        brokenCode: string;
        testInputs: string[];
    }) {
        //first, calculate trusted outputs using the correct solution
        const expectedOutput = await this.calculateExpectedOutputs(
            challenge.referenceSolution,
            challenge.testInputs,
        );

        //now run the broken code against the same tests, in ONE Judge0 run
        const brokenResults = await this.runnerService.runBatch(
            challenge.brokenCode,
            challenge.testInputs,
        );

        const wrongCount = brokenResults.filter(
            (r, i) => !r.ok || r.output.trim() !== expectedOutput[i],
        ).length;

        if (wrongCount === 0) {
            throw new Error('Rejected: broken code never differed from the reference');
        }

        return {
            status: 'Validated' as const,
            expectedOutput,
            totalTests: challenge.testInputs.length,
            failedTests: wrongCount,
        };
    }

    async saveChallenge(
        challenge: {
            title: string;
            description: string;
            difficulty: ChallengeDifficulty;
            brokenCode: string;
            referenceSolution: string;
            explanation: string;
            testInputs: string[];
            hints: string[];
            status: 'APPROVED',
        },
        expectedOutput: string[],
    ) {
        // translate lowercase (Gemini) to uppercase (database)
        const difficulty = DIFFICULTY_TO_DB[challenge.difficulty];

        // find the next free place in this level
        const last = await this.prisma.challenge.aggregate({
            where: { difficulty },
            _max: { order: true },
        });
        const nextOrder = (last._max.order ?? 0) + 1;

        const MAX_CASES_PER_LEVEL=20;
        if(nextOrder>MAX_CASES_PER_LEVEL){
            throw new BadRequestException(`The ${challenge.difficulty} level is full (${MAX_CASES_PER_LEVEL} cases max)`);
        }

        return this.prisma.challenge.create({
            data: {
                title: challenge.title,
                description: challenge.description,
                difficulty,
                order: nextOrder,
                status: 'APPROVED', // players only see APPROVED cases
                brokenCode: challenge.brokenCode,
                referenceSolution: challenge.referenceSolution,
                explanation: challenge.explanation,
                testCases: {
                    create: challenge.testInputs.map((input, index) => ({
                        input,
                        expectedOutput: expectedOutput[index],
                        order: index + 1,
                    })),
                },
                hints: {
                    create: challenge.hints.map((text, index) => ({
                        text,
                        order: index + 1,
                    })),
                },
            },
        });
    }
}