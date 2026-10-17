import { Test, TestingModule } from '@nestjs/testing';
import { RunnerController } from './runner.controller.js';
import { RunnerService } from './runner.service.js';
import { vi } from 'vitest';

describe('RunnerController', () => {
  let controller: RunnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RunnerController],
      providers: [
        {
          provide: RunnerService,
          useValue: {
            runCode: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RunnerController>(RunnerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});