import { Controller,Get,Post,Param, Body, UseGuards } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesService } from "./challenges.service.js";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SubmitDto } from "./dto/submit.dto.js";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard.js";

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController{
    constructor(
        private readonly challengeGeneratorService:ChallengeGeneratorService,
        private readonly challengesService:ChallengesService
    ){}
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('generate')
    async generate(){
        return this.challengeGeneratorService.generateChallenge();
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(){
        return this.challengesService.findAll();
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id')id:string){
        return this.challengesService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/submit')
    submit(@Param('id') id:string,@Body() body:SubmitDto){
        return this.challengesService.submit(id,body.code);
    }
}