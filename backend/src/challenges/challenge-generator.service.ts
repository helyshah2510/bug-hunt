import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import { RunnerService } from "../runner/runner.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { Difficulty } from "@prisma/client";
import type { ChallengeDifficulty } from './challenges.types.js';

const DIFFICULTY_TO_DB: Record<ChallengeDifficulty, Difficulty> = {
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
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

    async generateChallenge() {
        const response = await this.ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: ` Create one beginner-level Python debugging case for a
            detective-themed game called Bug Hunt.

            Return only a JSON object with these fields:
            {
                "title": "short case title",
                "description": "the debugging story and task",
                "difficulty": "easy",
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
                "explanation": "explain the bug and its fix simply"
            }

            Requirements:
                - Use Python only.
                - The broken code must contain ONE small, specific mistake, such as a wrong
                operator, a wrong comparison, an off-by-one error, or a wrong index.
                - The broken code must print a DIFFERENT result from the reference solution
                on at least one test input. Rewriting the same logic in another style
                (a different loop, renamed variables) is NOT a bug.
                - The broken code and the reference solution must differ only by that
                one fix. Keep everything else identical.
                - Both versions must use the same function name and the same parameters
                in the same order.
                - Include at least 3 test inputs. At least one must expose the bug,
                and at least one should give the same result in both versions.
                - Each test input must be Python code that calls the function and prints
                its result.
                - Do not include expected outputs; our backend will calculate them.
                - The description must not reveal where the bug is.
                - Return exactly 3 hints, from subtle to specific. Only the third
                hint may point at the faulty line.
                - Do not wrap the JSON in Markdown code fences.`,
        });
        const text = response.text;
        if (!text) {
            throw new Error('Gemini returned an empty response');
        }

        let challenge;

        try {
            challenge = JSON.parse(text);
        } catch {
            throw new Error('Gemini didnt return valid JSON');
        }

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

        // difficulty must be one of the three, saved in clean lowercase
        if (this.isNotEmptyText(challenge.difficulty)) {
            const level = challenge.difficulty.trim().toLowerCase();
            if (!['easy', 'medium', 'hard'].includes(level)) {
                problems.push('difficulty must be easy, medium or hard');
            } else {
                challenge.difficulty = level;
            }
        }

        if (
            !Array.isArray(challenge.testInputs) ||
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
        const expectedOutput: string[] = [];

        for (const input of testInputs) {
            const result = await this.runnerService.runCode(
                `${referenceSolution}\n${input}`,
            );
            if (result.outcome !== 'success') {
                throw new Error(
                    'The reference solution failed while calculating expected outputs',
                );
            }
            expectedOutput.push((result.output ?? '').trim());
        }
        return expectedOutput;
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

        //now run the broke code against the same tests.
        const testCases = challenge.testInputs.map((input, index) => ({
            input,
            expectedOutput: expectedOutput[index],
        }));

        const brokenResult = await this.runnerService.runTests(
            challenge.brokenCode,
            testCases,
        );

        const hasWrongAns = brokenResult.results.some(
            (result) => result.outcome === 'wrong_answer',
        );
        if (!hasWrongAns) {
            throw new Error('Generated challenge has been rejected as it has failed all the test');
        }

        return {
            status: 'Validated' as const,
            expectedOutput,
            totalTests: brokenResult.totalTests,
            failedTests: brokenResult.totalTests - brokenResult.passedTests,
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

        if (nextOrder > 10) {
            throw new Error(`The ${challenge.difficulty} level already has 10 challenges`);
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