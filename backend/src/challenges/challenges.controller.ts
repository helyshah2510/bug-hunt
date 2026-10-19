import { Controller,Get,Post,Param, Body } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesService } from "./challenges.service.js";
import { ApiTags,ApiResponse,ApiOperation } from "@nestjs/swagger";
import { SubmitDto } from "./dto/submit.dto.js";

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController{
    constructor(
        private readonly challengeGeneratorService:ChallengeGeneratorService,
        private readonly challengesService:ChallengesService
    ){}
    @Post('generate')
    async generate(){
        return this.challengeGeneratorService.generateChallenge();
    }

    @Get()
    findAll(){
        return this.challengesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id')id:string){
        return this.challengesService.findOne(id);
    }

    @Post(':id/submit')
    submit(@Param('id') id:string,@Body() body:SubmitDto){
        return this.challengesService.submit(id,body.code);
    }
}