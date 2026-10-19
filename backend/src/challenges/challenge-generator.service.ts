import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import { RunnerService } from "../runner/runner.service.js";

@Injectable()
export class ChallengeGeneratorService {
    private readonly ai: GoogleGenAI;
    constructor(
        private readonly configService: ConfigService,
        private readonly runnerService: RunnerService,
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
        const challenge = JSON.parse(text);
        const validation = await this.validateChallenge(challenge);

        return {
            ...challenge,
            ...validation,
        };
    }

    async calculateExpectedOutputs(
        refrenceSolution: string,
        testInputs: string[],
    ): Promise<string[]> {
        const expectedOutput: string[] = [];

        for (const input of testInputs) {
            const result = await this.runnerService.runCode(
                `${refrenceSolution}\n${input}`,
            );
            if (result.outcome !== 'success') {
                throw new Error(
                    'he reference solution failed while calculating expected outputs',
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

        console.log(challenge.brokenCode);
        console.log(challenge.referenceSolution);
        console.log(challenge.testInputs);
        console.log(expectedOutput);

        const hasWrongAns = brokenResult.results.some(
            (result) => result.outcome === 'wrong_answer',
        );
        if (!hasWrongAns) {
            console.log('test results ', brokenResult.results);
            throw new Error('Generated challenge has been rejected as it has failed all the test');
        }

        return {
            status: 'Validated' as const,
            expectedOutput,
            totalTests: brokenResult.totalTests,
            failedTests: brokenResult.totalTests - brokenResult.passedTests,
        };
    }
}