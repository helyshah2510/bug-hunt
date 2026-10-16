import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { RunnerModule } from './runner/runner.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      validate:(config)=>{
        if(!config.JUDGE0_URL){
          throw new Error('JUDGE0_URL is missing from environment configuration');
        }
        return config;
      },
    }),
    RunnerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
