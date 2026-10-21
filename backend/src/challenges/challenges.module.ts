import { Module } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesController } from "./challenges.controller.js";
import { RunnerModule } from "../runner/runner.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ChallengesService } from "./challenges.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
    imports:[RunnerModule,PrismaModule,AuthModule],
    controllers:[ChallengesController],
    providers:[ChallengeGeneratorService,ChallengesService],
    exports:[ChallengeGeneratorService],
})
export class ChallengesModule {}