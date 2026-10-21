import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { ConfigModule,ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports:[
    PrismaModule,
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory:(config:ConfigService)=>({
        secret:config.getOrThrow<string>('JWT_SECRET'),
        signOptions:{
          expiresIn:config.get<string>('JWT_EXPIRES_IN','7d') as any,
        },
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
