import { Controller, Get, Post, Param, Body, UseGuards, Req, UnauthorizedException,Query, BadRequestException } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesService } from "./challenges.service.js";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SubmitDto } from "./dto/submit.dto.js";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard.js";
import type { AuthenticatedRequest } from "../auth/guard/jwt-auth.guard.js";
import { ChallengeDifficulty } from "./challenges.types.js";

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
    constructor(
        private readonly challengeGeneratorService: ChallengeGeneratorService,
        private readonly challengesService: ChallengesService
    ) { }
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('generate')
    async generate(@Query('difficulty')difficulty:string) {
        if(!['EASY','MEDIUM','HARD'].includes(difficulty))
        {
            throw new BadRequestException('Difficulty must be EASY, MEDIUM or HARD');
        }
        return this.challengeGeneratorService.generateChallenge(difficulty as ChallengeDifficulty,);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() req:AuthenticatedRequest) {
        const userId=req.user?.sub;
        if(!userId){
            throw new UnauthorizedException();
        }
        return this.challengesService.findAll(userId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne( @Req() req:AuthenticatedRequest,@Param('id') id: string) {
        const userId=req.user?.sub;
        if(!userId){
            throw new UnauthorizedException();
        }
        return this.challengesService.findOne(userId,id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/submit')
    submit(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() body: SubmitDto,
    ) {
        const userId = req.user?.sub;
        if (!userId) {
            throw new UnauthorizedException();
        }
        return this.challengesService.submit(userId, id, body.code);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/hint')
    hint(@Req() req:AuthenticatedRequest, @Param('id') id:string){
        const userId=req.user?.sub;
        if(!userId){
            throw new UnauthorizedException();
        }
        return this.challengesService.useHint(userId,id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/skip')
    skip(@Req() req:AuthenticatedRequest, @Param('id') id:string){
        const userId=req.user?.sub;
        if(!userId){
            throw new UnauthorizedException();
        }
        return this.challengesService.skip(userId,id);
    }
}