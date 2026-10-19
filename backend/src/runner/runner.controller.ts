import { Controller,Body,HttpCode,HttpStatus,Post, } from '@nestjs/common';
import { RunnerService } from './runner.service.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('runner')
@Controller('runner')
export class RunnerController {
    constructor(private readonly runnerService:RunnerService){}

    @Post('run')
    @HttpCode(HttpStatus.OK)
    async run(@Body()body:{source:string}){
        return this.runnerService.runCode(body.source);
    }
}
