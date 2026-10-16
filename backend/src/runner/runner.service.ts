import { Injectable } from '@nestjs/common';
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
        const submitResponse = await fetch(
            `${this.judge0Url}/submissions?base64_encoded=false&wait=false`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_code: source,
                    language_id: 113,
                    cpu_time_limit: 2,
                    wall_time_limit: 5,
                    memory_limit: 128000,
                }),
            },
        );

        if (!submitResponse.ok) {
            throw new Error(`Judge0 submission failed: ${submitResponse.status}`);
        }

        const submission = await submitResponse.json();

        if (!submission.token) {
            throw new Error('Judge0 did not return a submission token');
        }

        const deadline = Date.now() + 15_000;

        while (Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 500));

            const resultResponse = await fetch(
                `${this.judge0Url}/submissions/${submission.token}?base64_encoded=false`,
            );

            if (!resultResponse.ok) {
                throw new Error(`Judge0 result request failed: ${resultResponse.status}`);
            }

            const result = await resultResponse.json();

            if (result.status.id > 2) {
                return this.normalizeResult(result);
            }
        }

        throw new Error('Timed out while waiting for the Judge0 result');
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
}
