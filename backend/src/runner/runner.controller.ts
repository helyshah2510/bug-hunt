import { Controller,Body,HttpCode,HttpStatus,Post, UseGuards, } from '@nestjs/common';
import { RunnerService } from './runner.service.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard.js';

@ApiTags('runner')
@Controller('runner')
export class RunnerController {
    constructor(private readonly runnerService:RunnerService){}

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('run')
    @HttpCode(HttpStatus.OK)
    async run(@Body()body:{source:string}){
        return this.runnerService.runCode(body.source);
    }
}
