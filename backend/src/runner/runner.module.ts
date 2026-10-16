import { Module } from '@nestjs/common';
import { RunnerService } from './runner.service.js';
import { RunnerController } from './runner.controller.js';

@Module({
  providers: [RunnerService],
  controllers: [RunnerController]
})
export class RunnerModule {}
