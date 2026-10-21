import { Module } from '@nestjs/common';
import { RunnerService } from './runner.service.js';
import { RunnerController } from './runner.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports:[AuthModule],
  providers: [RunnerService],
  controllers: [RunnerController],
  exports: [RunnerService],
})
export class RunnerModule {}
