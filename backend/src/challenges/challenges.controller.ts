import { Controller,Post } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";

@Controller('challenges')
export class ChallengesController{
    constructor(private readonly challengeGeneratorService:ChallengeGeneratorService){}
    @Post('generate')
    async generate(){
        return this.challengeGeneratorService.generateChallenge();
    }
}