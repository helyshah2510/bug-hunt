import { Controller,Post,Body, Get, UseGuards, Req, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guard/jwt-auth.guard.js';
import type { AuthenticatedRequest } from './guard/jwt-auth.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @Post('register')
    register(@Body()dto:RegisterDto){
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body()dto:LoginDto){
        return this.authService.login(dto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req()req:AuthenticatedRequest){
        return this.authService.me(req.user!.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('refresh')
    refresh(@Request()req:AuthenticatedRequest){
        return this.authService.refresh(req.user!.sub);
    }
}
