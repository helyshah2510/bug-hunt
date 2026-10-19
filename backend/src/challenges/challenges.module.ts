import { Module } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesController } from "./challenges.controller.js";
import { RunnerModule } from "../runner/runner.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ChallengesService } from "./challenges.service.js";

@Module({
    imports:[RunnerModule,PrismaModule],
    controllers:[ChallengesController],
    providers:[ChallengeGeneratorService,ChallengesService],
    exports:[ChallengeGeneratorService],
})
export class ChallengesModule {}