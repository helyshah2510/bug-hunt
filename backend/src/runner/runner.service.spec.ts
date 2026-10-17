import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RunnerService } from './runner.service.js';

describe('RunnerService', () => {
  let service: RunnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunnerService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => 'https://ce.judge0.com',
          },
        },
      ],
    }).compile();

    service = module.get<RunnerService>(RunnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should pass when the actual output matches the expected output', async () => {
    vi.spyOn(service, 'runCode').mockResolvedValue({
      outcome: 'success',
      output: '6\n',
      error: null,
      timeMs: 10,
      memoryKb: 1000,
    });

    const result = await service.runTests(
      'def add(a, b): return a + b',
      [
        {
          input: 'print(add(2, 4))',
          expectedOutput: '6',
        },
      ],
    );

    expect(result.totalTests).toBe(1);
    expect(result.passedTests).toBe(1);
    expect(result.results[0].outcome).toBe('passed');
  });

  it('should fail when the actual output differs from the expected output', async () => {
    vi.spyOn(service, 'runCode').mockResolvedValue({
      outcome: 'success',
      output: '5\n',
      error: null,
      timeMs: 10,
      memoryKb: 1000,
    });

    const result = await service.runTests(
      'def add(a, b): return a + b',
      [
        {
          input: 'print(add(2, 4))',
          expectedOutput: '6',
        },
      ],
    );

    expect(result.totalTests).toBe(1);
    expect(result.passedTests).toBe(0);
    expect(result.results[0].outcome).toBe('wrong_answer');
  });
});