import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { RunnerModule } from './runner/runner.module.js';
import { ChallengesModule } from './challenges/challenges.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      validate:(config)=>{
        if(!config.JUDGE0_URL){
          throw new Error('JUDGE0_URL is missing from environment configuration');
        }
        if(!config.GEMINI_API_KEY){
          throw new Error('Gemini API key is missing from the config file');
        }
        return config;
      },
    }),
    RunnerModule,
    ChallengesModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
