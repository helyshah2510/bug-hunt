type TestCase = {
    input: string;
    expectedOutput: string;
};
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RunnerResult = {
    outcome: 'success' | 'timeout' | 'memory' | 'error';
    output: string | null;
    error: string | null;
    timeMs: number | null;
    memoryKb: number | null;
};

@Injectable()
export class RunnerService {
    private readonly judge0Url: string;
    constructor(private readonly configService: ConfigService) {
        this.judge0Url = this.configService
            .getOrThrow<string>('JUDGE0_URL')
            .replace(/\/+$/, '');
    }


    async runCode(source: string) {
        const startTime = Date.now();
        const requestTimeoutMs = 8_000;
        const deadline = Date.now() + 60_000;

        // Step 1: Send the code to Judge0.
        let submitResponse: Response;

        try {
            submitResponse = await fetch(
                `${this.judge0Url}/submissions?base64_encoded=false&wait=false`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        source_code: source,
                        language_id: 113,
                        cpu_time_limit: 5,
                        wall_time_limit: 10,
                        memory_limit: 128000,
                    }),
                    signal: AbortSignal.timeout(requestTimeoutMs),
                },
            );
        } catch {
            throw new ServiceUnavailableException(
                'Judge0 is not responding. Please try again shortly.',
            );
        }

        if (!submitResponse.ok) {
            throw new ServiceUnavailableException(
                `Judge0 submission failed with status ${submitResponse.status}.`,
            );
        }

        const submission = await submitResponse.json();

        if (!submission.token) {
            throw new ServiceUnavailableException(
                'Judge0 did not return a submission token.',
            );
        }

        // Step 2: Poll Judge0 until execution finishes.
        while (Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 500));

            const remainingMs = deadline - Date.now();

            if (remainingMs <= 0) break;

            try {
                const resultResponse = await fetch(
                    `${this.judge0Url}/submissions/${submission.token}?base64_encoded=false`,
                    {
                        signal: AbortSignal.timeout(
                            Math.min(requestTimeoutMs, remainingMs),
                        ),
                    },
                );

                // Retry temporary server errors.
                if (resultResponse.status >= 500) {
                    console.log(`[judge0] got 5xx: ${resultResponse.status} elapsed=${Date.now() - startTime}ms`);
                    continue;
                }

                if (!resultResponse.ok) {
                    throw new ServiceUnavailableException(
                        `Judge0 result request failed with status ${resultResponse.status}.`,
                    );
                }

                const result = await resultResponse.json();
                console.log(`[judge0] status=${result.status?.description} elapsed=${Date.now() - startTime}ms`);

                // Status 1 = In Queue, 2 = Processing, 3= Accepted in judge0
                if (result.status?.id > 2) {
                    if (result.status.id !== 3) {
                        console.log(`[judge0] error output: ${result.stderr ?? result.message ?? 'none'}`);
                    }
                    return this.normalizeResult(result);
                }
            } catch (error) {
                if (error instanceof ServiceUnavailableException) {
                    throw error;
                }

                // A temporary network failure or request timeout.
                // Continue polling until the overall deadline.
                console.log(`[judge0] network error: ${(error as Error).message} elapsed=${Date.now() - startTime}ms`);
            }
        }

        throw new ServiceUnavailableException(
            'Judge0 took too long to respond. Please try again shortly.',
        );
    }


    private normalizeResult(result: any): RunnerResult {
        const statusId = result.status?.id;
        const description = result.status?.description ?? '';

        let outcome: RunnerResult['outcome'];

        if (statusId === 3) {
            outcome = 'success';
        }
        else if (statusId === 5) {
            outcome = 'timeout';
        }
        else if (/memory limit|out of memory|memory exceeded/i.test(
            `${description} ${result.message ?? ''}${result.stderr ?? ''}`,
        ) ||
            (result.memory != null && Number(result.memory) >= 128000)
        ) {
            outcome = 'memory';
        } else {
            outcome = 'error';
        }

        return {
            outcome,
            output: result.stdout ?? null,
            error:
                outcome === 'error' || outcome === 'memory'
                    ? result.stderr || result.message || description || 'Execution failed'
                    : outcome === 'timeout'
                        ? description || 'execution timed out'
                        : null,
            timeMs:
                result.time == null ? null : Math.round(Number(result.time) * 1000),
            memoryKb:
                result.memory == null ? null : Number(result.memory),
        };
    }

    async runTests(source: string, tests: TestCase[]) {
        const results = [];

        for (const test of tests) {
            const testSource = `${source}\n${test.input}`;
            const execution = await this.runCode(testSource);

            if (execution.outcome !== 'success') {
                results.push({
                    passed: false,
                    expectedOutput: test.expectedOutput,
                    actualOutput: execution.output,
                    outcome: execution.outcome,
                    error: execution.error,
                });

                continue;
            }

            const actualOutput = (execution.output ?? '').trim();
            const expectedOutput = test.expectedOutput.trim();
            const passed = actualOutput === expectedOutput;

            results.push({
                passed,
                expectedOutput: test.expectedOutput,
                actualOutput,
                outcome: passed ? 'passed' : 'wrong_answer',
                error: null,
            });
        }

        return {
            totalTests: tests.length,
            passedTests: results.filter((result) => result.passed).length,
            results,
        };
    }

    async runBatch(source: string, inputs: string[]) {
        const harness = [
            'import sys, io, json',
            `_src = ${JSON.stringify(source)}`,
            `_tests = ${JSON.stringify(inputs)}`,
            '_results = []',
            'for _t in _tests:',
            '    _ns = {}',
            '    _buf = io.StringIO()',
            '    _old = sys.stdout',
            '    sys.stdout = _buf',
            '    try:',
            '        exec(_src, _ns)',
            '        exec(_t, _ns)',
            '        _ok = True',
            '    except BaseException as e:',
            '        _ok = False',
            '        _buf.write(type(e).__name__ + ": " + str(e))',
            '    sys.stdout = _old',
            '    _results.append({"ok": _ok, "output": _buf.getvalue()})',
            'print("@@RESULTS@@" + json.dumps(_results))',
        ].join('\n');

        const execution = await this.runCode(harness);

        if (execution.outcome !== 'success') {
            throw new Error('Batch run failed: ' + (execution.error ?? execution.outcome));
        }
        const json = (execution.output ?? '').split('@@RESULTS@@').pop() ?? '[]';
        return JSON.parse(json) as { ok: boolean; output: string }[];
    }
}
